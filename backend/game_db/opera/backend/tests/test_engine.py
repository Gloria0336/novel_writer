from __future__ import annotations

import unittest
from types import SimpleNamespace

from backend.app.engine.context_policy import assemble_actor_view
from backend.app.engine.memory import embed_text
from backend.app.engine.rules import derive_seed, resolve_action
from backend.app.engine.summarizer import summarize_turn
from backend.app.services.defaults import build_default_rulebook


class EngineTests(unittest.TestCase):
    def test_actor_view_respects_visibility_boundaries(self) -> None:
        actor = SimpleNamespace(
            id="npc-1",
            knowledge_scopes_json=["geography"],
            secret_motives="Hide the relic.",
        )
        bundle = {
            "world_entries": [
                SimpleNamespace(id="w1", title="Port", category="geography", body="Visible", tags_json=[], metadata_json={}, visibility_scope="world"),
                SimpleNamespace(id="w2", title="Ritual", category="magic", body="Hidden", tags_json=[], metadata_json={}, visibility_scope="world"),
            ],
            "timeline": [
                SimpleNamespace(id="e1", sequence_no=1, event_kind="public", source_channel="gm", title="Bell", body="The bells ring.", payload_json={}, visibility_scope="public", actor_id=None),
                SimpleNamespace(id="e2", sequence_no=2, event_kind="private", source_channel="agent", title="Whisper", body="Only another NPC heard this.", payload_json={"witness_ids": ["npc-2"]}, visibility_scope="private", actor_id="npc-2"),
            ],
            "latest_snapshot": SimpleNamespace(current_scene="At the docks."),
            "memories": [
                SimpleNamespace(id="m1", actor_id=None, scope="public", summary="A rumor spreads.", facts_json=["rumor"], recent_excerpt="rumor"),
                SimpleNamespace(id="m2", actor_id="npc-1", scope="private", summary="I hid the relic.", facts_json=["relic"], recent_excerpt="relic"),
            ],
            "embedding_chunks": [
                SimpleNamespace(id="c1", actor_id="npc-1", scope="private", text="You hid the relic near the docks.", vector_json=embed_text("You hid the relic near the docks."), metadata_json={}),
                SimpleNamespace(id="c2", actor_id="npc-2", scope="private", text="Another secret.", vector_json=embed_text("Another secret."), metadata_json={}),
            ],
        }

        view = assemble_actor_view(bundle, actor=actor, retrieval_limit=3)

        self.assertEqual(len(view["layer1"]["world_entries"]), 1)
        self.assertEqual(view["layer1"]["world_entries"][0]["title"], "Port")
        self.assertEqual(len(view["layer2"]["experienced_events"]), 1)
        self.assertEqual(view["layer3"]["secret_motives"], "Hide the relic.")
        self.assertEqual(len(view["layer3"]["retrieved_memory"]), 1)

    def test_rules_engine_is_replayable(self) -> None:
        rulebook = build_default_rulebook()
        stats = {
            "attributes": {"might": 1, "grace": 2, "wit": 2, "spirit": 1},
            "skills": {"combat": 1, "stealth": 2, "investigation": 3, "influence": 1, "survival": 1, "sorcery": 0},
        }
        seed = derive_seed("campaign", "run", "event", "1")
        left = resolve_action(
            action_text="I inspect the alley for clues.",
            actor_name="Ari",
            actor_stats=stats,
            rulebook=rulebook,
            seed=seed,
        )
        right = resolve_action(
            action_text="I inspect the alley for clues.",
            actor_name="Ari",
            actor_stats=stats,
            rulebook=rulebook,
            seed=seed,
        )

        self.assertEqual(left["total"], right["total"])
        self.assertEqual(left["outcome"], right["outcome"])
        self.assertEqual(left["seed"], right["seed"])

    def test_summarizer_outputs_all_memory_channels(self) -> None:
        summary = summarize_turn(
            campaign_name="Test Campaign",
            snapshot={"current_scene": "Rain falls over the market.", "raw_state": {"open_threads": ["Find the envoy"]}},
            gm_output={"narration": "The market shutters rattle.", "pressure": "Factions close in.", "scene_title": "Opening"},
            actor_turns=[{"public_text": "Veyra offers help with a price."}],
            resolution={"outcome": "success", "narration": "Ari spots the hidden sigil."},
            actors=[
                {"id": "gm", "name": "GM", "role": "gm", "secret_motives": "Escalate"},
                {"id": "p1", "name": "Ari", "role": "player", "secret_motives": "Hide debt"},
            ],
            source_event_ids=["e1", "e2"],
        )

        self.assertIn("public_summary", summary)
        self.assertIn("gm_summary", summary)
        self.assertIn("director_summary", summary)
        self.assertEqual(len(summary["agent_memory_updates"]), 2)


if __name__ == "__main__":
    unittest.main()

