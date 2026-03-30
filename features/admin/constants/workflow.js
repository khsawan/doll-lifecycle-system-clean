import { PIPELINE_STAGE_LABELS, PIPELINE_STAGE_ORDER } from "../../../lib/pipelineState";

export const OPERATIONS_PRODUCTION_QUEUE_BUCKET_ORDER = Object.freeze([
  "needs_production_setup",
  "needs_character_work",
  "blocked_in_gateway",
]);

export const OPERATIONS_CONTENT_QUEUE_BUCKET_ORDER = Object.freeze([
  "needs_generation",
  "needs_review",
  "ready_to_publish",
]);

export const OPERATIONS_BOARD_FILTERS = Object.freeze([
  { value: "all", label: "All" },
  { value: "needs_attention", label: "Needs Attention" },
  { value: "production", label: "Production" },
  { value: "content", label: "Content" },
  { value: "live", label: "Live" },
  { value: "archived", label: "Archived" },
]);

export const OPERATIONS_BOARD_SORT_OPTIONS = Object.freeze([
  { value: "urgency", label: "Urgency" },
  { value: "last_updated", label: "Last Updated" },
  { value: "name", label: "Name" },
]);

export const PRODUCTION_STAGES = PIPELINE_STAGE_ORDER.map((stage, index) => ({
  key: stage,
  value: index + 1,
  label: PIPELINE_STAGE_LABELS[stage],
}));

export const PIPELINE_STAGE_READINESS_KEYS = Object.freeze({
  registered: "production",
  character: "character",
  content: "content",
  gateway: "gateway",
  ready: "overall",
});

export const DEPARTMENTS = [
  "Overview",
  "Production",
  "Character",
  "Content",
  "Digital",
  "Commerce",
  "Danger Zone",
];

export const showLegacyDepartmentsNavigation = false;
