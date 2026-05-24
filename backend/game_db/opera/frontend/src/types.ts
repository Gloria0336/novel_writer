export type CampaignSummary = {
  id: string;
  name: string;
  description: string;
  status: string;
  player_actor_id: string | null;
  active_run_id: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type NovelSummary = {
  novel_id: string;
  readme_summary: string;
  characters: Array<{
    char_id: string;
    title: string;
  }>;
  world_section_count: number;
};

export type ActorProfile = {
  id: string;
  name: string;
  role: string;
  persona: string;
  motives_json: string[];
  visibility_policy_json: Record<string, unknown>;
  knowledge_scopes_json: string[];
  secret_motives: string;
  model_provider: string;
  model_name: string;
  temperature: number;
  metadata_json: Record<string, unknown>;
};

export type StoryEvent = {
  id: string;
  run_id: string | null;
  sequence_no: number;
  event_kind: string;
  source_channel: string;
  actor_id: string | null;
  title: string;
  body: string;
  visibility_scope: string;
  payload_json: Record<string, unknown>;
  created_at: string;
};

export type BundleResponse = {
  campaign: CampaignSummary;
  rulebook: Record<string, unknown>;
  world_entries: Array<{
    id: string;
    title: string;
    category: string;
    visibility_scope: string;
    body: string;
    tags_json: string[];
    metadata_json: Record<string, unknown>;
  }>;
  actors: ActorProfile[];
  latest_snapshot: {
    id: string;
    version: number;
    current_scene: string;
    active_objectives_json: string[];
    npc_statuses_json: Record<string, unknown>;
    raw_state_json: Record<string, unknown>;
    created_at: string;
  } | null;
  timeline: StoryEvent[];
  memories: Array<{
    id: string;
    actor_id: string | null;
    scope: string;
    artifact_type: string;
    summary: string;
    facts_json: string[];
    recent_excerpt: string;
    source_event_ids_json: string[];
    token_count: number;
    created_at: string;
  }>;
  director_notes: Array<{
    id: string;
    note_type: string;
    title: string;
    body: string;
    payload_json: Record<string, unknown>;
    is_consumed: boolean;
    created_at: string;
  }>;
  gm_briefs: Array<{
    id: string;
    title: string;
    body: string;
    payload_json: Record<string, unknown>;
    reveal_in_context: boolean;
    created_at: string;
  }>;
  resolutions: Array<{
    id: string;
    run_id: string;
    action_event_id: string | null;
    seed: string;
    rule_version: string;
    outcome: string;
    total: number;
    target: number;
    breakdown_json: Record<string, unknown>;
    override_source: string | null;
    narration: string;
    created_at: string;
  }>;
};

export type ViewResponse = {
  campaign_id: string;
  audience: string;
  actor_id?: string | null;
  layers: Record<string, unknown>;
};

export type StepResponse = {
  campaign_id: string;
  run_id: string;
  status: string;
  current_node: string;
  gm_output: Record<string, unknown>;
  actor_turns: Array<Record<string, unknown>>;
  resolution: Record<string, unknown> | null;
  summary: Record<string, unknown> | null;
  node_log: Array<{ node: string; status: string; detail: string }>;
  interrupt_payload: Record<string, unknown>;
};

export type OpenRouterStatus = {
  connected: boolean;
  configured: boolean;
  status: string;
  status_code: number | null;
  latency_ms: number | null;
  checked_at: string;
  message: string;
};

export type StreamEnvelope = {
  event: string;
  timestamp: string;
  payload: Record<string, unknown>;
};

