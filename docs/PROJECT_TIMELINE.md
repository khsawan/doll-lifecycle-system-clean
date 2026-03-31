# PROJECT TIMELINE
## Maille et Merveille — Doll Lifecycle System

**Last updated:** 31 March 2026
**How to use:** Update status and notes as each phase completes.
**Statuses:** ✅ Done | 🔄 In Progress | 📋 Planned | ⏸ Blocked

---

## SUMMARY

| Status | Count |
|---|---|
| ✅ Done | 11 |
| 🔄 In Progress | 1 |
| 📋 Planned | 18 |
| ⏸ Blocked | 3 |

---

## PRIORITY LAYER 0 — FOUNDATION (COMPLETE)

| Phase | Status | Weeks | Notes |
|---|---|---|---|
| Architectural refactor | ✅ Done | W1–W3 | Feature modules, 254 tests, protected APIs |
| Prompt injection system | ✅ Done | W2 | guidelines.js, all four prompt builders |
| Content mgmt persistence | ✅ Done | W2 | generation / review / publish in Supabase |
| Ambient animations (C1) | ✅ Done | W3 | Particles, breathing, entrance, hover |
| Full audio system (C2) | ✅ Done | W3–W4 | Voice, ambient, scene-level, continuous |
| Variation engine (D1) | ✅ Done | W4 | 2–3 options per generation, operator selects |
| AI microservice | ✅ Done | W4 | Google + Anthropic, local/remote modes |
| Provider routing fix | ✅ Done | W5 | Google AI now resolves correctly |
| Vision + roadmap docs | ✅ Done | W5 | VISION_DOCUMENT + GAP_ANALYSIS committed |

---

## PRIORITY LAYER 1 — PRODUCTION FOUNDATIONS

| Phase | Status | Weeks | Notes |
|---|---|---|---|
| Phase B quality validation | ⏸ Blocked | TBD | Needs funded Anthropic API key |
| Phase U1 — universe data model | 📋 Planned | W6 | Supabase schema + admin UI + doll assignment |
| Phase U2 — universe AI injection | 📋 Planned | W6 | Real universe data into prompt blocks |
| Phase CB1 — character brief fields | 📋 Planned | W7 | Extended fields in admin + Supabase |
| Phase CB2 — character brief generator | 📋 Planned | W7 | New AI task: character_brief |
| Phase SL1 — story library model | 📋 Planned | W8 | Universe-linked stories + migration |
| Phase SL2 — story builder UI | 📋 Planned | W9–W10 | Template + elements + AI assist + publish |
| Phase AL1 — activity library | 📋 Planned | W11 | 4 activity types + public Activities scene |
| Phase PP1 — physical production | 📋 Planned | W12 | Production orders + quality gate + check-in |

---

## PRIORITY LAYER 2 — OPERATOR ENABLEMENT

| Phase | Status | Weeks | Notes |
|---|---|---|---|
| Phase OP1 — roles + permissions | 📋 Planned | W13 | Collaborator role + admin role |
| Phase OP2 — review workflow | 📋 Planned | W13 | Per-asset approve / reject + locking |
| Phase LU1 — living universe | 📋 Planned | W14 | Friends & Tales + new arrivals + content scope |

---

## PRIORITY LAYER 3 — CONTENT AND MARKETING

| Phase | Status | Weeks | Notes |
|---|---|---|---|
| Phase SM1 — social media layer | 📋 Planned | W15–W16 | Queue + scheduling + Buffer integration |
| Phase MK1 — marketing strategy | 📋 Planned | W16 | Dedicated planning session with Claude |
| Phase C2 — real audio (ElevenLabs) | ⏸ Blocked | TBD | Needs ElevenLabs budget |

---

## PRIORITY LAYER 4 — SCALE

| Phase | Status | Weeks | Notes |
|---|---|---|---|
| Phase SH1 — online shop | 📋 Planned | W18+ | Product pages + cart + payment |
| Phase CRM — customer management | 📋 Planned | W19+ | Order tracking + customer records |
| Phase AN1 — analytics | 📋 Planned | W19+ | Plausible integration |
| Phase LAB — creative lab tools | 📋 Planned | W20+ | AI-assisted concept generation |

---

## HOW TO UPDATE THIS DOCUMENT

When a phase completes:
1. Change status from 📋 Planned or 🔄 In Progress to ✅ Done
2. Update the week range to reflect actual completion
3. Update the summary counts at the top
4. Commit with message: `Update project timeline — [Phase name] complete`

When a phase starts:
1. Change status from 📋 Planned to 🔄 In Progress
2. Update the summary counts

When a blocker is resolved:
1. Change status from ⏸ Blocked to 📋 Planned or 🔄 In Progress
2. Add the week range
3. Update the summary counts

---

## BLOCKED ITEMS — ACTION REQUIRED

| Item | Blocked by | Owner |
|---|---|---|
| Phase B quality validation | Anthropic API key not funded | Founder |
| Phase C2 real audio | ElevenLabs budget not available | Founder |

---

## NEXT PHASE

**Phase U1 — Universe data model**
Technical specification: provided by Claude before Claude Code execution.
Dependencies: none — can start immediately.

---

*Document owner: Claude (Strategic Lead) — Maille et Merveille*
*Next review: Update after each completed phase*
