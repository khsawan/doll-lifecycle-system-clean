# Source Context Files

This document identifies the files that should be used as source context when maintaining system understanding across sessions.

## Purpose

- Use this file to decide which repository files should be read first before making structural, workflow, or architecture changes.
- This applies to Codex, ChatGPT, and human collaborators.
- For ChatGPT or any external assistant, this file is only useful if it is provided in the working context or shared in the conversation.

## Usage

- Always include all `CRITICAL` files for structural or system-level work.
- Include `IMPORTANT` files when the task touches the relevant area.
- Include `OPTIONAL` files only when the task needs deeper or specialized context.
- Revisit this file whenever the system architecture, workflow logic, or core data flow changes.

## Categorized File List

### System Logic

- `lib/pipelineState.js`  
  Category: System Logic  
  Importance: `CRITICAL`  
  Controls the canonical pipeline model, stage order, lock behavior, normalization, and transition rules.

- `lib/ai/normalize.js`  
  Category: System Logic  
  Importance: `IMPORTANT`  
  Controls the normalized JSON shape returned by AI generation tasks.

- `lib/ai/prompts/story.js`  
  Category: System Logic  
  Importance: `OPTIONAL`  
  Controls how story-generation prompts are built from doll and universe data.

- `lib/ai/prompts/contentPack.js`  
  Category: System Logic  
  Importance: `OPTIONAL`  
  Controls how content-pack prompts are built for product copy generation.

- `lib/ai/prompts/social.js`  
  Category: System Logic  
  Importance: `OPTIONAL`  
  Controls how social-content prompts are built.

### UI Workflow Layer

- `app/page.js`  
  Category: UI Workflow Layer  
  Importance: `CRITICAL`  
  Controls the main admin workflow, readiness model, stage actions, QR flow, commerce flow, and most operator-facing control logic.

- `app/doll/[slug]/page.js`  
  Category: UI Workflow Layer  
  Importance: `IMPORTANT`  
  Controls the public-facing doll page and how the digital layer reads doll and story data.

- `app/settings/page.js`  
  Category: UI Workflow Layer  
  Importance: `IMPORTANT`  
  Controls global app settings, especially AI provider/model settings and brand defaults.

### Data Layer

- `lib/supabase.js`  
  Category: Data Layer  
  Importance: `IMPORTANT`  
  Controls Supabase client creation and the environment-based database connection.

- `app/api/ai/generate/route.js`  
  Category: Data Layer  
  Importance: `IMPORTANT`  
  Controls the API boundary for AI generation requests and request validation.

- `lib/ai/index.js`  
  Category: Data Layer  
  Importance: `IMPORTANT`  
  Controls AI task routing, provider selection, and loading AI settings from `app_settings`.

- `lib/ai/providers/anthropic.js`  
  Category: Data Layer  
  Importance: `OPTIONAL`  
  Controls Anthropic integration and mock fallback behavior.

### Configuration

- `.env.example`  
  Category: Configuration  
  Importance: `IMPORTANT`  
  Documents required environment variables for Supabase and the public site URL.

- `README.md`  
  Category: Configuration  
  Importance: `OPTIONAL`  
  Provides lightweight project setup and environment guidance.

- `next.config.mjs`  
  Category: Configuration  
  Importance: `OPTIONAL`  
  Controls exposed build-time environment metadata used by the app.

- `package.json`  
  Category: Configuration  
  Importance: `OPTIONAL`  
  Defines the runtime stack and core dependencies.

### Documentation

- `docs/DOLL_LIFECYCLE_SYSTEM.md`  
  Category: Documentation  
  Importance: `CRITICAL`  
  Defines the official system specification, architecture, stages, readiness model, and UX principles.

- `docs/WORKFLOW_RULES.md`  
  Category: Documentation  
  Importance: `CRITICAL`  
  Defines how changes must be made, validated, and documented.

## Recommended Core Context Files

### CRITICAL

- `docs/DOLL_LIFECYCLE_SYSTEM.md`
- `docs/WORKFLOW_RULES.md`
- `lib/pipelineState.js`
- `app/page.js`

### IMPORTANT

- `app/doll/[slug]/page.js`
- `app/settings/page.js`
- `lib/supabase.js`
- `app/api/ai/generate/route.js`
- `lib/ai/index.js`
- `.env.example`

### OPTIONAL

- `lib/ai/normalize.js`
- `lib/ai/providers/anthropic.js`
- `lib/ai/prompts/story.js`
- `lib/ai/prompts/contentPack.js`
- `lib/ai/prompts/social.js`
- `README.md`
- `next.config.mjs`
- `package.json`

## Why The Critical Files Matter

- `docs/DOLL_LIFECYCLE_SYSTEM.md`  
  Explains what the system is supposed to be.

- `docs/WORKFLOW_RULES.md`  
  Explains how the system must be changed safely.

- `lib/pipelineState.js`  
  Encodes the real workflow progression and locking rules in executable form.

- `app/page.js`  
  Contains the live admin workflow, readiness behavior, and most of the system's active control flow.

## Notes

- There are currently no explicit schema or migration files in the repository.
- Current schema assumptions are inferred from runtime usage of `dolls`, `stories`, `content_assets`, `orders`, `themes`, `app_settings`, and the `doll-assets` storage bucket.
