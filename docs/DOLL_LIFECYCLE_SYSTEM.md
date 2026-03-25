# Doll Lifecycle System

## Usage Rule

This document must be:

- read before any structural/system change
- updated whenever system behavior or architecture changes

This document is the long-term source of truth for what the Doll Lifecycle System is, how it is structured, and how production progression works.

## Vision

- The Doll Lifecycle System transforms handmade dolls into physical + digital products.
- It is a production operating system, not just a tool.
- It connects craft, identity, content, digital activation, and commerce into one controlled workflow.
- The goal is operational clarity: every doll should move through the same structured lifecycle with visible status and readiness.

## Architecture

The system is organized into three layers:

- Creation Lab: the future upstream layer for ideation, concept generation, universe design, and AI-assisted creation.
- Production System: the current core layer where dolls are registered, developed, validated, and moved through the production pipeline.
- Commerce & Distribution: the downstream layer where sellability, public access, distribution, and later customer-facing operations are managed.

## Production Pipeline

The production pipeline is the main operational framework of the system. It defines how a doll moves from first registration to full readiness.

### Registered

- Meaning: the doll exists as an official production record inside the system.
- Focus: registration, base production identity, and initial physical record setup.
- Completion represents: the doll is properly entered into the operating system and is ready to move into character development.

### Character

- Meaning: the doll becomes a defined character rather than only a registered object.
- Focus: name, identity, emotional core, personality, and character world.
- Completion represents: the doll's narrative identity is clear enough to support story and content generation.

### Content

- Meaning: the doll's story assets and communication assets are created.
- Focus: story content, content pack content, and social-facing content.
- Completion represents: the doll has the core narrative and content assets needed for digital presentation and launch preparation.

### Gateway

- Meaning: the doll is activated as a digital and commercial product node.
- Focus: digital identity, public access, QR/public-link readiness, and commerce gating.
- Completion represents: the doll is digitally ready and commercially eligible to move toward sale and distribution.

### Ready

- Meaning: the doll has passed through the full production workflow.
- Focus: final operational readiness across the full system.
- Completion represents: the doll is fully validated as a production-ready product and can proceed into downstream commercial workflows.

## Stage Lock System

The pipeline uses a controlled lock model to ensure sequential progression.

- Each stage has one of three statuses: `open`, `completed`, or `locked`.
- `open` means the stage is the current active working stage.
- `completed` means the stage has been finished and validated.
- `locked` means the stage is not yet available because an earlier stage is still active or has been reopened.
- Only one stage can be active at a time. This is the one active stage rule.
- Completing the current `open` stage marks it as `completed` and unlocks the next stage by setting that stage to `open`.
- Reopening a completed stage sets that stage back to `open` and locks all downstream stages again.
- Reopen behavior protects workflow integrity by preventing downstream stages from remaining active after an upstream change.
- Stage state is persisted in `pipeline_state`.
- `pipeline_state` is the durable workflow record and preserves the production progression state for each doll.

## Readiness Model

Readiness is a validation model. It is related to the pipeline, but it is not the same thing as stage progression.

### Production Readiness

- Validates the core production record and physical-product essentials.
- Covers the minimum information required for the doll to exist as a managed production item.

### Character Readiness

- Validates character identity.
- Covers the doll's name, theme or world, personality, emotional hook, expression, and narrative identity structure.

### Content Readiness

- Validates narrative and communication assets.
- Covers story content, content pack content, and social content needed to represent the doll consistently.

### Digital Readiness

- Validates digital activation.
- Covers the public-facing digital identity such as slug, public link, and QR-linked access layer.

### Commerce Readiness

- Validates whether the doll is commercially eligible inside the product system.
- This is controlled through `commerce_status`.

### Gateway Rule

- Gateway readiness depends on digital readiness plus `commerce_status`.
- Gateway is complete only when the doll is digitally ready and `commerce_status` is `ready_for_sale`.
- Orders or CRM activity do not define Gateway readiness.

## Data Model

### `pipeline_state` (`jsonb`)

- Stores the structured per-stage workflow state.
- Persists the status of each pipeline stage.
- Acts as the source of truth for production progression.
- Supports normalized stage behavior across current and legacy records.

### `commerce_status`

- Defines product sellability state.
- Allowed values are `draft`, `ready_for_sale`, and `unavailable`.
- `ready_for_sale` is the key commercial state used by Gateway readiness.
- This field controls product readiness for commerce, not customer order flow.

### CRM Separation

- CRM and order tracking are separate from product readiness.
- Orders describe customer and fulfillment lifecycle activity.
- Product readiness describes whether the doll itself is operationally ready.
- The system must keep these concerns separate.

## UX Principles

- Workflow-first UI: the interface should guide the operator through production progression, not just expose fields.
- No redundancy: the same concept should not be represented in multiple competing places.
- One source of truth per concept: each operational concept should have one canonical owner in the UI and data model.
- Compact, structured interface: information density should stay high, clear, and controlled.
- Pipeline as main control surface: the pipeline is the primary way operators understand state, progress, and allowed actions.

## Current State

- Phase 9 is complete: Stage Lock System implemented.
- UI architecture is unified.
- The pipeline is established as the main production control surface.
- The Identity card has been introduced as a core summary element for the doll record.

## Future Phases

- Phase 10: Universe layer for higher-level world and theme structures across multiple dolls.
- Phase 11: AI Creation Lab for upstream concept development, assisted writing, and creation support.
- Phase 12: Digital expansion beyond the current public page and activation layer.
- Phase 13: CRM + Social expansion while keeping customer systems separate from production readiness.
- Phase 14: Roles & Permissions for structured access control and organizational scale.
