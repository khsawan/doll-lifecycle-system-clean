# PHASE B3 — TECHNICAL SPECIFICATION
## Content Management Status Persistence

**Prepared by:** Claude (Strategic Lead)
**For:** ChatGPT (Planning) + Codex (Execution)
**Coordinator:** Founder
**Status:** Ready to execute — Phase B (B1–B5) structurally complete

---

## CONTEXT

Currently the three content management statuses exist only in UI local state:
- `generation_status` → resets to `not_started` on every page reload
- `review_status` → resets to `draft` on every page reload
- `publish_status` → resets to `hidden` on every page reload

The normalization functions already exist in `app/page.js`:
- `normalizeContentGenerationStatus()`
- `normalizeContentReviewStatus()`
- `normalizeContentPublishStatus()`
- `buildLocalContentManagementState()` already reads from the doll record

This means the admin is already READY to read these values from Supabase.
The only missing pieces are:
1. The three columns do not yet exist on the `dolls` table in Supabase
2. Status changes are not yet written back to Supabase

---

## WHAT THIS PHASE DOES

- Adds three columns to the `dolls` table in Supabase
- Writes status changes to Supabase when the operator approves or publishes
- Reads persisted values on doll load (already handled by `buildLocalContentManagementState`)
- Does NOT change pipeline_state, commerce_status, QR logic, or public route behavior

---

## IMPORTANT CONSTRAINTS

- `pipeline_state` must not be touched
- `commerce_status` must not be touched
- Public doll route (`app/doll/[slug]/page.js`) must not be touched
- QR generation logic must not be touched
- CRM / order flow must not be touched
- Changes must be additive and backward-compatible
- Existing dolls with no values for these columns must continue to work
  (they already do — `buildLocalContentManagementState` handles missing values)

---

## ALLOWED VALUES (already defined in app/page.js)

```
generation_status: "not_started" | "generated"
review_status:     "draft" | "approved"
publish_status:    "hidden" | "live"
```

Default values when missing:
```
generation_status = "not_started"
review_status     = "draft"
publish_status    = "hidden"
```

---

## EXECUTION ORDER

This phase has two steps. Execute in order. Validate between steps.

---

## STEP B3-1 — Add columns to Supabase

This step is done manually in the Supabase dashboard.
Codex does NOT execute this step.
The founder executes this step directly.

### Instructions for founder

1. Go to your Supabase project dashboard
2. Open the Table Editor → select the `dolls` table
3. Add three new columns using the SQL Editor
   (Dashboard → SQL Editor → New Query → paste and run):

```sql
ALTER TABLE dolls
  ADD COLUMN IF NOT EXISTS generation_status text DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS review_status text DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS publish_status text DEFAULT 'hidden';
```

4. Run the query
5. Verify the three columns appear in the `dolls` table

### Validation checklist for B3-1

```
1. generation_status column exists on dolls table → Yes/No
2. review_status column exists on dolls table → Yes/No
3. publish_status column exists on dolls table → Yes/No
4. All three columns have correct default values → Yes/No
5. Existing doll rows are unaffected (defaults applied) → Yes/No
```

Report these five results to Claude before B3-2 starts.

---

## STEP B3-2 — Write status changes to Supabase

This step is executed by Codex.
Only `app/page.js` is modified in this step.

### What needs to change in app/page.js

Currently `updateSelectedContentManagement()` updates local state only:

```javascript
// CURRENT BEHAVIOR (local state only)
function updateSelectedContentManagement(patch) {
  setContentManagementByDoll((prev) => ({
    ...prev,
    [selected.id]: {
      ...selectedContentManagement,
      ...patch,
    },
  }));
}
```

This function must be updated to ALSO persist the patch to Supabase
after updating local state.

### Exact behavior after the change

1. Local state updates immediately (preserve existing behavior — no change here)
2. Supabase update runs after local state update
3. If Supabase update fails: local state remains updated, operator sees an error notice
4. If Supabase update succeeds: no additional UI change needed (local state already reflects it)
5. On next doll load: `buildLocalContentManagementState()` reads the persisted values
   from the doll record — this already works because it reads
   `record.generation_status`, `record.review_status`, `record.publish_status`

### Exact implementation for Codex

Replace the existing `updateSelectedContentManagement` function in `app/page.js`
with this updated version:

```javascript
async function updateSelectedContentManagement(patch) {
  if (!selected?.id) return;

  // Update local state immediately
  setContentManagementByDoll((prev) => ({
    ...prev,
    [selected.id]: {
      ...selectedContentManagement,
      ...patch,
    },
  }));

  // Persist to Supabase
  if (!supabase) return;

  const { error: saveError } = await supabase
    .from("dolls")
    .update(patch)
    .eq("id", selected.id);

  if (saveError) {
    setError(
      `Content status updated locally but could not be saved. ${saveError.message}`
    );
  }
}
```

### Also update the three callers of updateSelectedContentManagement

The three functions that call `updateSelectedContentManagement` are:
- `handleApproveManagedContent()`
- `handlePublishManagedContent()`
- `handleUnpublishManagedContent()`

These currently call it synchronously. Since it is now async,
add `await` to each call site:

```javascript
// handleApproveManagedContent
async function handleApproveManagedContent() {
  if (selectedContentManagement.generation_status !== "generated") return;
  setError("");
  await updateSelectedContentManagement({ review_status: "approved" });
  setNotice("Content approved.");
}

// handlePublishManagedContent
async function handlePublishManagedContent() {
  if (selectedContentManagement.review_status !== "approved") return;
  setError("");
  await updateSelectedContentManagement({ publish_status: "live" });
  setNotice("Content marked live.");
}

// handleUnpublishManagedContent
async function handleUnpublishManagedContent() {
  if (selectedContentManagement.publish_status !== "live") return;
  setError("");
  await updateSelectedContentManagement({ publish_status: "hidden" });
  setNotice("Content hidden.");
}
```

### Also update generation_status persistence

When `handleGenerateManagedContent()` successfully generates and saves content,
it should also persist `generation_status: "generated"` to Supabase.

This already happens implicitly because the generated content patch is saved
to Supabase — and `buildLocalContentManagementState()` derives
`generation_status = "generated"` when `intro_script`, `story_pages`,
and `play_activity` are present on the record.

NO CHANGE IS NEEDED for generation_status persistence.
It is already handled correctly by the existing logic.

---

## VALIDATION CHECKLIST FOR B3-2

```
1. Only app/page.js was modified → Yes/No
2. updateSelectedContentManagement now writes to Supabase after local state update → Yes/No
3. Local state still updates immediately (no regression) → Yes/No
4. handleApproveManagedContent uses await → Yes/No
5. handlePublishManagedContent uses await → Yes/No
6. handleUnpublishManagedContent uses await → Yes/No
7. No changes to pipeline_state logic → Yes/No
8. No changes to commerce_status logic → Yes/No
9. No changes to public doll route → Yes/No
10. No changes to QR logic → Yes/No
```

---

## MANUAL VALIDATION (founder — after B3-2 is deployed)

1. Open a doll in Content Studio
2. Generate content → confirm generation_status shows "Generated"
3. Reload the page → confirm generation_status still shows "Generated"
4. Approve the content → confirm review_status shows "Approved"
5. Reload the page → confirm review_status still shows "Approved"
6. Publish the content → confirm publish_status shows "Live"
7. Reload the page → confirm publish_status still shows "Live"
8. Unpublish → confirm publish_status returns to "Hidden"
9. Reload the page → confirm publish_status still shows "Hidden"

All nine must pass. Report results to Claude.

---

## WHAT THIS PHASE DOES NOT DO

- Does NOT change what the public doll page shows
- Does NOT gate the public experience behind publish_status
  (publish_status is an operator management signal only at this stage)
- Does NOT modify pipeline_state or readiness logic
- Does NOT affect commerce_status or Gateway behavior
- Does NOT create a CRM or order flow

---

## AFTER B3 — WHAT COMES NEXT

Phase B3 completion closes the Phase B cycle.

The next phase will be determined by Claude based on:
- API key availability (Phase B quality validation is still open)
- Priority ranking from the audit

Current priority queue:
1. Phase B quality validation (when API key is funded)
2. Phase C1 — CSS/SVG ambient animation in public experience
3. Phase C2 — ElevenLabs audio integration (when budget allows)

---

## DOCUMENTATION UPDATE REQUIRED AFTER B3

After B3 is validated, `docs/DOLL_LIFECYCLE_SYSTEM.md` must be updated
to reflect that content management statuses are now persisted to Supabase.

The section "Build 1 Scope" currently states:
"These statuses do not yet persist structurally."

This must be updated to reflect the new persisted behavior.
Claude will provide the exact documentation update after validation passes.
