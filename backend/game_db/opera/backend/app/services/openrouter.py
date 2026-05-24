from __future__ import annotations

from contextvars import ContextVar, Token
from datetime import datetime, timezone
from time import perf_counter
from typing import Any

import httpx

from backend.app.core.config import get_settings


_request_openrouter_api_key: ContextVar[str | None] = ContextVar(
    "request_openrouter_api_key",
    default=None,
)


def set_request_openrouter_api_key(api_key: str | None) -> Token[str | None]:
    return _request_openrouter_api_key.set(api_key.strip() if api_key and api_key.strip() else None)


def reset_request_openrouter_api_key(token: Token[str | None]) -> None:
    _request_openrouter_api_key.reset(token)


class NarrativeService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def _api_key(self) -> str | None:
        return _request_openrouter_api_key.get() or self.settings.openrouter_api_key

    def check_connection(self) -> dict[str, Any]:
        checked_at = datetime.now(timezone.utc).isoformat()
        api_key = self._api_key()
        if not api_key:
            return {
                "connected": False,
                "configured": False,
                "status": "missing_api_key",
                "status_code": None,
                "latency_ms": None,
                "checked_at": checked_at,
                "message": "OPENROUTER_API_KEY is not configured.",
            }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": self.settings.site_url,
            "X-Title": self.settings.site_name,
        }
        started = perf_counter()
        try:
            response = httpx.get(
                f"{self.settings.openrouter_base_url}/auth/key",
                headers=headers,
                timeout=5.0,
            )
            latency_ms = round((perf_counter() - started) * 1000)
            response.raise_for_status()
            return {
                "connected": True,
                "configured": True,
                "status": "ok",
                "status_code": response.status_code,
                "latency_ms": latency_ms,
                "checked_at": checked_at,
                "message": "OpenRouter connection is healthy.",
            }
        except httpx.HTTPStatusError as exc:
            latency_ms = round((perf_counter() - started) * 1000)
            return {
                "connected": False,
                "configured": True,
                "status": "http_error",
                "status_code": exc.response.status_code,
                "latency_ms": latency_ms,
                "checked_at": checked_at,
                "message": exc.response.text[:240],
            }
        except Exception as exc:
            latency_ms = round((perf_counter() - started) * 1000)
            return {
                "connected": False,
                "configured": True,
                "status": "connection_error",
                "status_code": None,
                "latency_ms": latency_ms,
                "checked_at": checked_at,
                "message": str(exc),
            }

    def _complete(self, *, system_prompt: str, user_prompt: str, model_name: str, temperature: float) -> str | None:
        api_key = self._api_key()
        if not api_key:
            return None

        headers = {
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": self.settings.site_url,
            "X-Title": self.settings.site_name,
        }
        payload = {
            "model": model_name,
            "temperature": temperature,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        }

        try:
            response = httpx.post(
                f"{self.settings.openrouter_base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=20.0,
            )
            response.raise_for_status()
            data = response.json()
            choices = data.get("choices", [])
            if not choices:
                return None
            return choices[0].get("message", {}).get("content")
        except Exception:
            return None

    def render_gm_frame(
        self,
        *,
        gm_actor: Any,
        gm_view: dict[str, Any],
        latest_player_action: Any | None,
        director_notes: list[Any],
    ) -> dict[str, Any]:
        scene = gm_view["layer2"]["current_scene"]
        cues = [note.title for note in director_notes if note.payload_json.get("share_with_gm") or note.note_type == "nudge"]
        action_text = latest_player_action.body if latest_player_action else "No player action is pending; advance the tension through the environment."
        system_prompt = (
            "You are the GM Agent for a local TRPG. Keep the narration sensory, precise, and responsive to player agency. "
            "Do not reveal hidden director information unless it is in the GM cue list."
        )
        user_prompt = (
            f"Scene: {scene}\n"
            f"Player action: {action_text}\n"
            f"Director cues: {', '.join(cues) or 'none'}\n"
            "Return a brief framing narration."
        )
        content = self._complete(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            model_name=gm_actor.model_name,
            temperature=gm_actor.temperature,
        )
        narration = content or (
            f"{scene} The air tightens as {action_text.lower()} "
            f"and every nearby faction starts measuring the cost of the next move."
        )
        return {
            "scene_title": "Lantern District Opening",
            "scene": scene,
            "narration": narration.strip(),
            "pressure": f"Cues in play: {', '.join(cues) if cues else 'none'}",
            "model": gm_actor.model_name,
        }

    def render_actor_turn(
        self,
        *,
        actor: Any,
        actor_view: dict[str, Any],
        latest_player_action: Any | None,
    ) -> dict[str, Any]:
        scene = actor_view["layer2"]["current_scene"]
        public_hint = latest_player_action.body if latest_player_action else "the scene shifts without warning"
        motive = actor.motives_json[0] if actor.motives_json else "Protect your position."
        system_prompt = (
            "You are an RPG character agent. Stay inside your knowledge boundary and act from your motives."
        )
        user_prompt = (
            f"Scene: {scene}\n"
            f"Latest public beat: {public_hint}\n"
            f"Motive: {motive}\n"
            f"Secret motive: {actor.secret_motives}\n"
            "Return one short in-character reaction and one hidden intent sentence."
        )
        content = self._complete(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            model_name=actor.model_name,
            temperature=actor.temperature,
        )
        if content:
            public_text = content.strip().splitlines()[0]
            hidden_intent = content.strip().splitlines()[-1]
        else:
            stance = actor.metadata_json.get("stance", "watchful")
            public_text = f"{actor.name} reacts in a {stance} way, trying to {motive.lower()}"
            hidden_intent = actor.secret_motives

        return {
            "actor_id": actor.id,
            "actor_name": actor.name,
            "public_text": public_text,
            "hidden_intent": hidden_intent,
            "action": public_text,
            "model": actor.model_name,
        }

