from __future__ import annotations

import os
import unittest

from fastapi.testclient import TestClient

from backend.app.db import init_db
from backend.app.main import create_app


class ApiFlowTests(unittest.TestCase):
    def setUp(self) -> None:
        os.environ["PYTHONDONTWRITEBYTECODE"] = "1"
        self.app = create_app(database_url="sqlite+pysqlite:///:memory:")
        init_db()
        self.client = TestClient(self.app)

    def tearDown(self) -> None:
        self.client.close()

    def test_campaign_flow_export_import_and_visibility(self) -> None:
        create_response = self.client.post(
            "/api/campaigns",
            json={
                "name": "API Campaign",
                "description": "Integration flow",
                "player_name": "Ari",
                "premise": "A vanished envoy leaves behind a storm of clues."
            },
        )
        self.assertEqual(create_response.status_code, 200)
        bundle = create_response.json()
        campaign_id = bundle["campaign"]["id"]
        player_actor_id = bundle["campaign"]["player_actor_id"]

        note_response = self.client.post(
            f"/api/campaigns/{campaign_id}/actions/director",
            json={
                "title": "Hidden Note",
                "content": "Keep this secret from the GM.",
                "command_type": "note",
                "payload": {"share_with_gm": False}
            },
        )
        self.assertEqual(note_response.status_code, 200)

        action_response = self.client.post(
            f"/api/campaigns/{campaign_id}/actions/player",
            json={"actor_id": player_actor_id, "content": "I inspect the route and follow the freshest footprints."},
        )
        self.assertEqual(action_response.status_code, 200)

        step_response = self.client.post(f"/api/campaigns/{campaign_id}/run/step", json={})
        self.assertEqual(step_response.status_code, 200)
        step_payload = step_response.json()
        self.assertEqual(step_payload["status"], "paused")
        self.assertIsNotNone(step_payload["resolution"])

        gm_view = self.client.get(f"/api/campaigns/{campaign_id}/views/gm").json()
        actor_view = self.client.get(f"/api/campaigns/{campaign_id}/views/agent/{player_actor_id}").json()
        self.assertEqual(gm_view["audience"], "gm")
        self.assertNotIn("director_notes", actor_view["layers"])
        self.assertEqual(gm_view["layers"]["layer4"]["director_cues"], [])

        export_response = self.client.get(f"/api/campaigns/{campaign_id}/export?format=json")
        self.assertEqual(export_response.status_code, 200)
        export_payload = export_response.json()["payload"]

        import_response = self.client.post(
            f"/api/campaigns/{campaign_id}/import",
            json={"payload": export_payload, "preserve_ids": False},
        )
        self.assertEqual(import_response.status_code, 200)

        list_response = self.client.get("/api/campaigns")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.json()), 2)

    def test_novel_listing_and_campaign_bootstrap(self) -> None:
        novels_response = self.client.get("/api/novels")
        self.assertEqual(novels_response.status_code, 200)
        novels = novels_response.json()
        novel_04 = next((novel for novel in novels if novel["novel_id"] == "novel_04_dungen"), None)
        self.assertIsNotNone(novel_04)
        self.assertGreater(len(novel_04["characters"]), 0)
        self.assertGreater(novel_04["world_section_count"], 0)

        player_char_id = novel_04["characters"][0]["char_id"]
        create_response = self.client.post(
            "/api/campaigns/from-novel",
            json={
                "novel_id": "novel_04_dungen",
                "name": "Novel 04 Campaign",
                "premise": "A living abyss campaign begins.",
                "player_char_id": player_char_id,
            },
        )
        self.assertEqual(create_response.status_code, 200)
        bundle = create_response.json()
        campaign_id = bundle["campaign"]["id"]
        player_actor_id = bundle["campaign"]["player_actor_id"]
        self.assertEqual(bundle["campaign"]["metadata_json"]["novel_id"], "novel_04_dungen")
        self.assertEqual(bundle["latest_snapshot"]["raw_state_json"]["novel_id"], "novel_04_dungen")
        self.assertGreater(len(bundle["world_entries"]), 0)
        self.assertIsNotNone(player_actor_id)

        director_view = self.client.get(f"/api/campaigns/{campaign_id}/views/director").json()
        actor_view = self.client.get(f"/api/campaigns/{campaign_id}/views/agent/{player_actor_id}").json()
        self.assertIn("novel_db_overlay", director_view["layers"])
        self.assertIn("secrets_lockbox", director_view["layers"]["novel_db_overlay"])
        self.assertIn("novel_db_overlay", actor_view["layers"])
        self.assertNotIn("secrets_lockbox", actor_view["layers"]["novel_db_overlay"])


if __name__ == "__main__":
    unittest.main()
