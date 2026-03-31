#!/usr/bin/env node
/**
 * scripts/updateTimeline.mjs
 * Maille et Merveille — Project Timeline Updater
 *
 * Usage:
 *   node scripts/updateTimeline.mjs --phase <id> --status <status>
 *
 * Statuses:
 *   done        ✅ Done
 *   inprogress  🔄 In Progress
 *   planned     📋 Planned
 *   blocked     ⏸ Blocked
 *
 * Phase IDs:
 *   arch, prom, cont, anim, audi, vari, aisv, prov, docs
 *   bqua, u1, u2, cb1, cb2, sl1, sl2, al1, pp1
 *   op1, op2, lu1
 *   sm1, mk1, c2r
 *   sh1, crm, an1, lab
 *
 * Examples:
 *   node scripts/updateTimeline.mjs --phase u1 --status done
 *   node scripts/updateTimeline.mjs --phase u1 --status inprogress
 *   node scripts/updateTimeline.mjs --phase bqua --status planned --weeks W6
 *   node scripts/updateTimeline.mjs --phase u1 --status done --weeks W6 --note "Universe table + admin UI complete"
 *
 * What it does:
 *   1. Reads docs/PROJECT_TIMELINE.md
 *   2. Updates the phase status, week range, and note
 *   3. Recalculates summary counts
 *   4. Writes the updated file
 *   5. Prints a confirmation
 *
 * Called by:
 *   Claude, Claude Code, ChatGPT-driven Codex, or any AI tool
 *   after a phase is validated.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TIMELINE_PATH = resolve(__dirname, "../docs/PROJECT_TIMELINE.md");

const STATUS_EMOJI = {
  done: "✅ Done",
  inprogress: "🔄 In Progress",
  planned: "📋 Planned",
  blocked: "⏸ Blocked",
};

const PHASE_REGISTRY = {
  arch:  { label: "Architectural refactor",           defaultWeeks: "W1–W3"   },
  prom:  { label: "Prompt injection system",           defaultWeeks: "W2"      },
  cont:  { label: "Content mgmt persistence",          defaultWeeks: "W2"      },
  anim:  { label: "Ambient animations (C1)",           defaultWeeks: "W3"      },
  audi:  { label: "Full audio system (C2)",            defaultWeeks: "W3–W4"   },
  vari:  { label: "Variation engine (D1)",             defaultWeeks: "W4"      },
  aisv:  { label: "AI microservice",                   defaultWeeks: "W4"      },
  prov:  { label: "Provider routing fix",              defaultWeeks: "W5"      },
  docs:  { label: "Vision + roadmap docs",             defaultWeeks: "W5"      },
  bqua:  { label: "Phase B quality validation",        defaultWeeks: "TBD"     },
  u1:    { label: "Phase U1 — universe data model",    defaultWeeks: "W6"      },
  u2:    { label: "Phase U2 — universe AI injection",  defaultWeeks: "W6"      },
  cb1:   { label: "Phase CB1 — character brief fields",defaultWeeks: "W7"      },
  cb2:   { label: "Phase CB2 — character brief generator", defaultWeeks: "W7"  },
  sl1:   { label: "Phase SL1 — story library model",   defaultWeeks: "W8"      },
  sl2:   { label: "Phase SL2 — story builder UI",      defaultWeeks: "W9–W10"  },
  al1:   { label: "Phase AL1 — activity library",      defaultWeeks: "W11"     },
  pp1:   { label: "Phase PP1 — physical production",   defaultWeeks: "W12"     },
  op1:   { label: "Phase OP1 — roles + permissions",   defaultWeeks: "W13"     },
  op2:   { label: "Phase OP2 — review workflow",       defaultWeeks: "W13"     },
  lu1:   { label: "Phase LU1 — living universe",       defaultWeeks: "W14"     },
  sm1:   { label: "Phase SM1 — social media layer",    defaultWeeks: "W15–W16" },
  mk1:   { label: "Phase MK1 — marketing strategy",    defaultWeeks: "W16"     },
  c2r:   { label: "Phase C2 — real audio (ElevenLabs)","defaultWeeks": "TBD"  },
  sh1:   { label: "Phase SH1 — online shop",           defaultWeeks: "W18+"    },
  crm:   { label: "Phase CRM — customer management",   defaultWeeks: "W19+"    },
  an1:   { label: "Phase AN1 — analytics",             defaultWeeks: "W19+"    },
  lab:   { label: "Phase LAB — creative lab tools",    defaultWeeks: "W20+"    },
};

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      result[key] = args[i + 1] || "";
      i++;
    }
  }
  return result;
}

function validateArgs(args) {
  const errors = [];
  if (!args.phase) errors.push("Missing --phase argument");
  if (!args.status) errors.push("Missing --status argument");
  if (args.phase && !PHASE_REGISTRY[args.phase]) {
    errors.push(`Unknown phase: "${args.phase}". Valid IDs: ${Object.keys(PHASE_REGISTRY).join(", ")}`);
  }
  if (args.status && !STATUS_EMOJI[args.status]) {
    errors.push(`Unknown status: "${args.status}". Valid: done, inprogress, planned, blocked`);
  }
  return errors;
}

function updateTableRow(content, phaseLabel, newStatus, newWeeks, newNote) {
  const statusEmoji = STATUS_EMOJI[newStatus];
  const lines = content.split("\n");
  let updated = false;

  const result = lines.map(line => {
    if (!line.includes("|")) return line;
    const cells = line.split("|").map(c => c.trim());
    if (cells.length < 4) return line;
    const cellPhase = cells[1];
    if (!cellPhase.includes(phaseLabel)) return line;

    const currentWeeks = cells[3] || "";
    const currentNote = cells[4] || "";

    const finalWeeks = newWeeks || currentWeeks;
    const finalNote = newNote || currentNote;

    updated = true;
    return `| ${phaseLabel} | ${statusEmoji} | ${finalWeeks} | ${finalNote} |`;
  });

  return { content: result.join("\n"), updated };
}

function recalculateSummary(content) {
  const counts = { done: 0, inprogress: 0, planned: 0, blocked: 0 };

  const lines = content.split("\n");
  lines.forEach(line => {
    if (!line.includes("|")) return;
    if (line.includes("✅ Done")) counts.done++;
    else if (line.includes("🔄 In Progress")) counts.inprogress++;
    else if (line.includes("📋 Planned")) counts.planned++;
    else if (line.includes("⏸ Blocked")) counts.blocked++;
  });

  return content
    .replace(/(\| ✅ Done\s*\|\s*)(\d+)/, `$1${counts.done}`)
    .replace(/(\| 🔄 In Progress\s*\|\s*)(\d+)/, `$1${counts.inprogress}`)
    .replace(/(\| 📋 Planned\s*\|\s*)(\d+)/, `$1${counts.planned}`)
    .replace(/(\| ⏸ Blocked\s*\|\s*)(\d+)/, `$1${counts.blocked}`);
}

function updateLastUpdated(content) {
  const today = new Date().toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return content.replace(
    /\*\*Last updated:\*\* .+/,
    `**Last updated:** ${today}`
  );
}

function main() {
  const args = parseArgs();
  const errors = validateArgs(args);

  if (errors.length > 0) {
    console.error("\n❌ Timeline update failed:\n");
    errors.forEach(e => console.error(`  • ${e}`));
    console.error("\nUsage: node scripts/updateTimeline.mjs --phase <id> --status <status> [--weeks <range>] [--note <text>]\n");
    process.exit(1);
  }

  const phase = PHASE_REGISTRY[args.phase];
  const newStatus = args.status;
  const newWeeks = args.weeks || null;
  const newNote = args.note || null;

  let content;
  try {
    content = readFileSync(TIMELINE_PATH, "utf-8");
  } catch {
    console.error(`\n❌ Could not read timeline file at: ${TIMELINE_PATH}\n`);
    process.exit(1);
  }

  const { content: updatedContent, updated } = updateTableRow(
    content,
    phase.label,
    newStatus,
    newWeeks,
    newNote
  );

  if (!updated) {
    console.error(`\n❌ Phase "${phase.label}" not found in timeline table.\n`);
    process.exit(1);
  }

  const withSummary = recalculateSummary(updatedContent);
  const withDate = updateLastUpdated(withSummary);

  writeFileSync(TIMELINE_PATH, withDate, "utf-8");

  console.log(`\n✅ Timeline updated successfully`);
  console.log(`   Phase:  ${phase.label}`);
  console.log(`   Status: ${STATUS_EMOJI[newStatus]}`);
  if (newWeeks) console.log(`   Weeks:  ${newWeeks}`);
  if (newNote)  console.log(`   Note:   ${newNote}`);
  console.log(`\n   File: docs/PROJECT_TIMELINE.md`);
  console.log(`\n   Next step: git add docs/PROJECT_TIMELINE.md && git commit -m "Timeline: ${phase.label} → ${newStatus}"\n`);
}

main();
