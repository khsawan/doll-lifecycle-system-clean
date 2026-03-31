# PHASE U1 — TECHNICAL SPECIFICATION
## Universe Data Model

**Prepared by:** Claude (Strategic Lead)
**For:** Claude Code
**Status:** Ready to execute
**Branch:** main
**Depends on:** Nothing — this is the foundation phase
**Unlocks:** U2, CB1, SL1, AL1, LU1 — everything downstream

---

## CONTEXT

The universe is the living entity of the entire system.
Currently universes do not exist as structured data objects.
The dolls table has a theme_name text field and a universe_id column
that is not yet a proper foreign key to a universes table.

This phase creates the universe as a first-class data object and
connects dolls to it properly.

The three active universes:
- Farm World (emotional core: Warmth)
- Little Dreamers (emotional core: Grace)
- Together World (emotional core: Belonging)

---

## CONSTRAINTS — READ BEFORE WRITING ANY CODE

- No breaking changes to existing doll records
- theme_name on dolls stays as-is — do not remove it
- pipeline_state, commerce_status, QR logic must not be touched
- lib/ai/normalize.js must not be touched
- Public doll route behavior must not change
- All changes must be additive and backward-compatible
- Existing dolls with no universe_id must continue to work normally

---

## EXECUTION ORDER — FIVE STEPS

Execute in order. Validate each step before proceeding.
Do not combine steps.

---

## STEP U1-1 — Supabase: Create universes table

CLAUDE CODE DOES NOT EXECUTE THIS STEP.
Prepare the SQL and give it to the founder to run in Supabase SQL Editor.

```sql
CREATE TABLE IF NOT EXISTS universes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  emotional_core text,
  tone_rules jsonb DEFAULT '{}'::jsonb,
  visual_theme jsonb DEFAULT '{}'::jsonb,
  audio_urls jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS universes_slug_idx ON universes(slug);
CREATE INDEX IF NOT EXISTS universes_status_idx ON universes(status);
```

Validation checklist for U1-1:
```
1. universes table exists in Supabase → Yes/No
2. All columns present → Yes/No
3. slug has unique constraint → Yes/No
4. Both indexes created → Yes/No
```

---

## STEP U1-2 — Supabase: Seed the three active universes

CLAUDE CODE DOES NOT EXECUTE THIS STEP.
Prepare the SQL and give it to the founder to run in Supabase SQL Editor.

```sql
INSERT INTO universes (name, slug, description, emotional_core, tone_rules, status)
VALUES
  (
    'Farm World',
    'farm-world',
    'A world of gentle mornings, animals, and the quiet satisfaction of daily care. Earthy, grounding, nurturing.',
    'Warmth',
    '{
      "voice_register": "grounded, nurturing, reassuring",
      "vocabulary": "earthy and gentle — barn, meadow, morning light, soft hay, quiet chickens",
      "tonal_axis": "close and intimate — already in relationship with the child",
      "forbidden": "anything loud, rushed, or urban"
    }'::jsonb,
    'active'
  ),
  (
    'Little Dreamers',
    'little-dreamers',
    'A world of ballerinas, artists, and musicians. Delicate, poetic, expressive.',
    'Grace',
    '{
      "voice_register": "delicate, poetic, expressive",
      "vocabulary": "light and movement — ribbon, stage, brushstroke, melody, graceful",
      "tonal_axis": "inviting forward — the world is slightly ahead of the child, beckoning",
      "forbidden": "anything clumsy, loud, or mundane"
    }'::jsonb,
    'active'
  ),
  (
    'Together World',
    'together-world',
    'A world of first friendships, finding your people, the child who saves you a seat.',
    'Belonging',
    '{
      "voice_register": "warm, social, gently joyful",
      "vocabulary": "connection and presence — best friend, morning circle, save a seat, hold hands",
      "tonal_axis": "close and inviting — the world feels safe and inhabited",
      "forbidden": "anything isolating, competitive, or unkind"
    }'::jsonb,
    'active'
  );
```

Validation checklist for U1-2:
```
1. Three universe records exist in universes table → Yes/No
2. Farm World record exists with slug farm-world → Yes/No
3. Little Dreamers record exists with slug little-dreamers → Yes/No
4. Together World record exists with slug together-world → Yes/No
5. All three have status = active → Yes/No
6. tone_rules JSONB populated for all three → Yes/No
```

---

## STEP U1-3 — Supabase: Add universe_id foreign key to dolls

CLAUDE CODE DOES NOT EXECUTE THIS STEP.
Prepare the SQL and give it to the founder to run in Supabase SQL Editor.

```sql
ALTER TABLE dolls
  ADD COLUMN IF NOT EXISTS universe_id uuid REFERENCES universes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS dolls_universe_id_idx ON dolls(universe_id);
```

ON DELETE SET NULL means if a universe is ever deleted, dolls are
not deleted — their universe_id becomes NULL. Safe and backward-compatible.

Validation checklist for U1-3:
```
1. universe_id column exists on dolls table → Yes/No
2. universe_id is a foreign key referencing universes(id) → Yes/No
3. Existing doll rows unaffected (universe_id = NULL by default) → Yes/No
4. Index created on dolls.universe_id → Yes/No
```

---

## STEP U1-4 — Admin: Universe management screen

CLAUDE CODE EXECUTES THIS STEP.

Create one new file: features/admin/components/AdminUniversePanel.js
Plus minimal wiring into the existing admin shell.

Before writing anything:
- Read features/admin/components/AdminContentManagementPanel.js
  as a reference for component structure and style patterns
- Read features/admin/services/detailApi.js for the API call pattern
- Read app/api/admin/dolls/[id]/route.js for the existing PATCH endpoint

What to build — three views only:

1. Universe list view
   - Fetch all universes from Supabase universes table
   - Display: name, emotional core, status, count of assigned dolls
   - Each universe is selectable

2. Universe detail view
   - Show: name, description, emotional core, tone_rules summary
   - List dolls currently assigned to this universe (universe_id matches)
   - List dolls with no universe assigned (universe_id is NULL)

3. Doll assignment
   - Operator selects an unassigned doll from the NULL list
   - Assigns it to the current universe
   - Uses existing PATCH app/api/admin/dolls/[id]/route.js
     to update universe_id on the doll record
   - List refreshes after assignment

Do NOT build:
- Universe creation form (seed data handles this for now)
- Universe editing
- Universe deletion
- Visual theme or audio management
- Any drag and drop

Validation checklist for U1-4:
```
1. AdminUniversePanel.js created → Yes/No
2. Universe list renders with correct data from Supabase → Yes/No
3. Universe detail view shows assigned dolls correctly → Yes/No
4. Unassigned dolls list is visible → Yes/No
5. Assigning a doll updates universe_id on the doll record → Yes/No
6. Assignment persists after page reload → Yes/No
7. Existing admin functionality unaffected → Yes/No
8. No changes to pipeline_state, commerce_status, QR logic → Yes/No
```

---

## STEP U1-5 — AI layer: Update UNIVERSE_BLOCK with real data

CLAUDE CODE EXECUTES THIS STEP.

Two files only:
- lib/ai/guidelines.js
- features/admin/domain/generation.js

Before writing anything:
- Read lib/ai/guidelines.js fully
- Read features/admin/domain/generation.js fully
- Read features/admin/hooks/useAdminDetailState.js
  to understand how doll data is currently loaded

Current behavior:
UNIVERSE_BLOCK(payload) reads from payload.universe which is
built inline in generation.js from doll fields.
It does not read from the universes table.

Target behavior:
When a doll has a universe_id, the generation payload includes
the full universe record so UNIVERSE_BLOCK receives real data.

Change 1 — features/admin/domain/generation.js:
Update buildAdminAIGenerationPayload to accept an optional
universe record parameter. When a universe record is provided,
use its fields (name, description, emotional_core, tone_rules)
instead of the inline fallback object.
The fallback behavior must remain for dolls with no universe_id.

Change 2 — lib/ai/guidelines.js:
Update UNIVERSE_BLOCK(payload) to also read and inject:
- payload.universe.emotional_core
- payload.universe.tone_rules (extract voice_register and tonal_axis)

Updated UNIVERSE_BLOCK output should include:
```
[UNIVERSE: {universeName}]
The child is visiting this world — write from inside it, not about it.

- Universe name: {name}
- Description: {description}
- Emotional core: {emotional_core}
- Tonal register: {tone_rules.voice_register}
- Tonal axis: {tone_rules.tonal_axis}
- Environment: {environment_description or character_world}
```

Fallback when fields are missing: "Not provided" — same as current behavior.

Change 3 — universe data fetching:
The universe record needs to be available when AI generation is triggered.
Find the correct seam in the admin hooks/services to fetch the universe
record for the selected doll's universe_id and pass it into the
generation payload. Follow the existing data loading patterns exactly.

Validation checklist for U1-5:
```
1. lib/ai/guidelines.js updated → Yes/No
2. UNIVERSE_BLOCK now includes emotional_core and tone_rules → Yes/No
3. generation.js accepts and uses real universe data when available → Yes/No
4. Fallback works correctly when universe_id is NULL → Yes/No
5. No changes to normalize.js → Yes/No
6. No changes to any prompt JSON output shapes → Yes/No
7. No changes to pipeline_state, commerce_status, QR logic → Yes/No
```

---

## PHASE COMPLETION

After all five steps are validated:

1. Run the timeline updater:
```bash
node scripts/updateTimeline.mjs --phase u1 --status done --weeks W6 --note "Universe table, seed data, admin UI, doll assignment, AI injection complete"
```

2. Update docs/DOLL_LIFECYCLE_SYSTEM.md — add to Current State section:
```
### Phase U1 — Universe Data Model (Complete)

- universes table created in Supabase with name, slug, description,
  emotional_core, tone_rules, visual_theme, audio_urls, status fields
- Three active universes seeded: Farm World, Little Dreamers, Together World
- universe_id foreign key added to dolls table (ON DELETE SET NULL)
- Admin universe management screen added (list, detail, doll assignment)
- Doll-to-universe assignment operational via existing admin API
- AI UNIVERSE_BLOCK updated to read from real universe record data
- Backward-compatible: existing dolls with no universe_id continue to work
```

3. Tell the founder to commit:
```bash
git add -A
git commit -m "Phase U1 complete — universe data model, admin UI, AI injection"
git push origin main
```

---

## IMPORTANT NOTES

1. Steps U1-1, U1-2, U1-3 are SQL only.
   Prepare each SQL block, give it to the founder, wait for confirmation
   of each checklist before proceeding to the next step.

2. For U1-4, read AdminContentManagementPanel.js first.
   Match its structure, patterns, and style exactly.

3. For U1-5, read both target files fully before touching them.
   This is a small surgical change — not a refactor.

4. After each step — report the checklist and stop.
   Never proceed without explicit confirmation.

5. When in doubt about any architectural decision — stop.
   Report the question to the founder.
   The founder brings it to Claude (claude.ai) for a decision.
