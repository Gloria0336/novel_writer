from __future__ import annotations

from typing import Any

from backend.app.core.config import get_settings
from backend.app.engine.context_policy import assemble_actor_view, assemble_gm_view
from backend.app.engine.rules import derive_seed, resolve_action
from backend.app.engine.summarizer import summarize_turn
from backend.app.services import campaigns
from backend.app.services.events import broker
from backend.app.services.openrouter import NarrativeService

try:
    from langgraph.graph import StateGraph  # type: ignore

    LANGGRAPH_AVAILABLE = True
except Exception:
    StateGraph = None
    LANGGRAPH_AVAILABLE = False


class OrchestratorService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.narrative_service = NarrativeService()
        self.runtime_label = "langgraph" if LANGGRAPH_AVAILABLE else "sequential-fallback"

    def _interrupt_if_needed(
        self,
        *,
        run: Any,
        campaign_id: str,
        pause_before_node: str | None,
        node_name: str,
        node_log: list[dict[str, str]],
    ) -> dict[str, Any] | None:
        if pause_before_node != node_name:
            return None
        run.status = "interrupted"
        run.current_node = node_name
        run.interrupt_payload_json = {
            "reason": "pause_before_node",
            "node": node_name,
            "runtime": self.runtime_label,
        }
        broker.publish(
            campaign_id,
            "interrupt",
            {"node": node_name, "reason": "pause_before_node", "runtime": self.runtime_label},
        )
        node_log.append({"node": node_name, "status": "interrupted", "detail": "Execution paused before node."})
        return run.interrupt_payload_json

    def run_step(self, session: Any, campaign_id: str, payload: Any) -> dict[str, Any]:
        run = campaigns.get_or_create_run(session, campaign_id, payload.run_id)
        bundle = campaigns.get_campaign_components(session, campaign_id)
        gm_actor = next(actor for actor in bundle["actors"] if actor.role == "gm")
        snapshot = bundle["latest_snapshot"]
        pending_player_action = campaigns.fetch_pending_player_action(session, campaign_id)
        pending_director_notes = campaigns.fetch_pending_director_notes(session, campaign_id)
        pending_gm_briefs = bundle["gm_briefs"]
        node_log: list[dict[str, str]] = []
        gm_output: dict[str, Any] = {}
        actor_turns: list[dict[str, Any]] = []
        summary: dict[str, Any] | None = None
        resolution_payload: dict[str, Any] | None = None
        emitted_event_ids: list[str] = []

        steps = [
            ("load_state", "Loaded campaign, rulebook, state snapshot, and pending inputs."),
            ("director_preface", "Collected director notes and GM briefs."),
            ("gm_frame", "Generated GM scene framing."),
            ("actor_round", "Generated NPC reactions."),
            ("rules_resolution", "Resolved deterministic rules for the latest player action."),
            ("state_commit", "Committed a new story state snapshot."),
            ("summarize", "Compressed the turn into public and private memory artifacts."),
        ]

        for node_name, detail in steps:
            interrupt = self._interrupt_if_needed(
                run=run,
                campaign_id=campaign_id,
                pause_before_node=payload.pause_before_node,
                node_name=node_name,
                node_log=node_log,
            )
            if interrupt:
                session.commit()
                return {
                    "campaign_id": campaign_id,
                    "run_id": run.id,
                    "status": run.status,
                    "current_node": run.current_node,
                    "gm_output": gm_output,
                    "actor_turns": actor_turns,
                    "resolution": resolution_payload,
                    "summary": summary,
                    "node_log": node_log,
                    "interrupt_payload": interrupt,
                }

            broker.publish(campaign_id, "node_started", {"node": node_name, "detail": detail})
            run.current_node = node_name

            if node_name == "director_preface":
                run.interrupt_payload_json = {
                    "pending_director_notes": [note.title for note in pending_director_notes],
                    "pending_gm_briefs": [brief.title for brief in pending_gm_briefs],
                }

            elif node_name == "gm_frame":
                gm_view = assemble_gm_view(bundle)
                gm_output = self.narrative_service.render_gm_frame(
                    gm_actor=gm_actor,
                    gm_view=gm_view,
                    latest_player_action=pending_player_action,
                    director_notes=pending_director_notes,
                )
                gm_event = campaigns.append_story_event(
                    session,
                    campaign_id=campaign_id,
                    run_id=run.id,
                    event_kind="gm_frame",
                    source_channel="gm",
                    actor_id=gm_actor.id,
                    title=gm_output["scene_title"],
                    body=gm_output["narration"],
                    visibility_scope="public",
                    payload={"pressure": gm_output["pressure"], "runtime": self.runtime_label},
                )
                emitted_event_ids.append(gm_event.id)

            elif node_name == "actor_round":
                for actor in [item for item in bundle["actors"] if item.role == "npc"][: payload.max_actor_turns]:
                    actor_view = assemble_actor_view(
                        bundle=bundle,
                        actor=actor,
                        retrieval_limit=self.settings.retrieval_limit,
                    )
                    turn = self.narrative_service.render_actor_turn(
                        actor=actor,
                        actor_view=actor_view,
                        latest_player_action=pending_player_action,
                    )
                    actor_turns.append(turn)
                    event = campaigns.append_story_event(
                        session,
                        campaign_id=campaign_id,
                        run_id=run.id,
                        event_kind="actor_turn",
                        source_channel="agent",
                        actor_id=actor.id,
                        title=f"{actor.name} reacts",
                        body=turn["public_text"],
                        visibility_scope="public",
                        payload={
                            "hidden_intent": turn["hidden_intent"],
                            "witness_ids": [bundle["campaign"].player_actor_id, actor.id],
                        },
                    )
                    emitted_event_ids.append(event.id)

            elif node_name == "rules_resolution" and pending_player_action:
                override_note = next(
                    (
                        note
                        for note in pending_director_notes
                        if note.note_type == "override" or "forced_outcome" in note.payload_json or "forced_roll" in note.payload_json
                    ),
                    None,
                )
                actor = next((item for item in bundle["actors"] if item.id == pending_player_action.actor_id), None)
                if actor:
                    seed = derive_seed(campaign_id, run.id, pending_player_action.id, str(snapshot.version if snapshot else 1))
                    resolution_payload = resolve_action(
                        action_text=pending_player_action.body,
                        actor_name=actor.name,
                        actor_stats=actor.metadata_json.get("stats", {}),
                        rulebook=bundle["rulebook"].payload_json,
                        seed=seed,
                        override=(
                            {**override_note.payload_json, "source": f"director_note:{override_note.id}"}
                            if override_note
                            else None
                        ),
                    )
                    resolution_record = campaigns.create_resolution(
                        session,
                        campaign_id=campaign_id,
                        run_id=run.id,
                        action_event_id=pending_player_action.id,
                        resolution=resolution_payload,
                        rule_version=bundle["rulebook"].version,
                    )
                    event = campaigns.append_story_event(
                        session,
                        campaign_id=campaign_id,
                        run_id=run.id,
                        event_kind="resolution",
                        source_channel="system",
                        title=f"Resolution: {resolution_payload['outcome']}",
                        body=resolution_payload["narration"],
                        visibility_scope="public",
                        actor_id=actor.id,
                        payload={"resolution_id": resolution_record.id, **resolution_payload},
                    )
                    emitted_event_ids.append(event.id)

            elif node_name == "state_commit":
                raw_state = dict(snapshot.raw_state_json if snapshot else {})
                active_objectives = list(snapshot.active_objectives_json if snapshot else [])
                npc_statuses = dict(snapshot.npc_statuses_json if snapshot else {})
                raw_state["last_run_id"] = run.id
                raw_state["last_gm_output"] = gm_output
                raw_state["last_actor_turns"] = actor_turns
                if resolution_payload:
                    raw_state["last_resolution"] = resolution_payload
                    threat_clock = dict(raw_state.get("threat_clock", {}))
                    threat_clock["city_unrest"] = threat_clock.get("city_unrest", 0) + (
                        0 if resolution_payload["outcome"] in {"success", "critical_success"} else 1
                    )
                    raw_state["threat_clock"] = threat_clock
                for note in pending_director_notes:
                    if note.note_type == "inject_event":
                        active_objectives.append(note.title)
                        raw_state.setdefault("director_flags", []).append(note.body)
                    if note.note_type == "retcon":
                        raw_state.setdefault("retcons", []).append(note.body)
                snapshot = campaigns.create_snapshot(
                    session,
                    campaign_id=campaign_id,
                    current_scene=gm_output.get("narration", snapshot.current_scene if snapshot else ""),
                    active_objectives=active_objectives[-8:],
                    npc_statuses=npc_statuses,
                    raw_state=raw_state,
                )

            elif node_name == "summarize":
                summary = summarize_turn(
                    campaign_name=bundle["campaign"].name,
                    snapshot={"current_scene": snapshot.current_scene, "raw_state": snapshot.raw_state_json},
                    gm_output=gm_output,
                    actor_turns=actor_turns,
                    resolution=resolution_payload,
                    actors=[
                        {
                            "id": actor.id,
                            "name": actor.name,
                            "role": actor.role,
                            "secret_motives": actor.secret_motives,
                        }
                        for actor in bundle["actors"]
                    ],
                    source_event_ids=emitted_event_ids,
                )
                campaigns.persist_memory_summary(
                    session,
                    campaign_id=campaign_id,
                    actor_id=None,
                    memory_payload=summary["public_memory"],
                )
                for update in summary["agent_memory_updates"]:
                    campaigns.persist_memory_summary(
                        session,
                        campaign_id=campaign_id,
                        actor_id=update["actor_id"],
                        memory_payload=update,
                    )
                campaigns.compress_memories(
                    session,
                    campaign_id=campaign_id,
                    token_threshold=self.settings.memory_token_threshold,
                )
                if pending_player_action:
                    campaigns.mark_story_event_processed(pending_player_action, run.id)
                campaigns.mark_notes_consumed(pending_director_notes)

            node_log.append({"node": node_name, "status": "completed", "detail": detail})
            broker.publish(campaign_id, "node_completed", {"node": node_name, "detail": detail})

        run.status = "paused"
        run.current_node = "awaiting_next_step"
        run.interrupt_payload_json = {
            "reason": "manual_step_complete",
            "next_action": "invoke /run/step again",
            "runtime": self.runtime_label,
        }
        run.sequence_cursor = len(bundle["timeline"]) + len(emitted_event_ids)
        bundle["campaign"].active_run_id = run.id
        session.commit()

        # Staging 自動同步：把這回合產出寫進 working/（永不碰 novel_db）。
        # 由 feature flag 控制；失敗不影響回合結果。
        if self.settings.staging_sync_enabled:
            try:
                from backend.app.services import campaign_staging

                sync_stats = campaign_staging.sync_run(session, campaign_id)
                broker.publish(campaign_id, "staging_synced", sync_stats)
            except Exception as exc:  # pragma: no cover
                broker.publish(campaign_id, "staging_sync_error", {"error": str(exc)})

        return {
            "campaign_id": campaign_id,
            "run_id": run.id,
            "status": run.status,
            "current_node": run.current_node,
            "gm_output": gm_output,
            "actor_turns": actor_turns,
            "resolution": resolution_payload,
            "summary": summary,
            "node_log": node_log,
            "interrupt_payload": run.interrupt_payload_json,
        }
