export const DEFAULT_THEMES = [
  "Unassigned",
  "Nature Friends",
  "Little Dreamers",
  "Cozy World",
];

export const STORY_TONES = ["Gentle", "Playful", "Magical"];

export const COMMERCE_STATUSES = Object.freeze([
  "draft",
  "ready_for_sale",
  "unavailable",
]);

export const CONTENT_GENERATION_STATUSES = Object.freeze(["not_started", "generated"]);
export const CONTENT_REVIEW_STATUSES = Object.freeze(["draft", "approved"]);
export const CONTENT_PUBLISH_STATUSES = Object.freeze(["hidden", "live"]);

export const DEFAULT_CONTENT_MANAGEMENT_STATE = Object.freeze({
  generation_status: "not_started",
  review_status: "draft",
  publish_status: "hidden",
});

export const V1_PLAY_ACTIVITY_CHOICE_IDS = Object.freeze([
  "comforting_object",
  "playful_action",
  "friendly_interaction",
]);
