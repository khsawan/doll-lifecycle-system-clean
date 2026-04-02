export const BLUEPRINT_STATE = {
  lastUpdated: "April 2026",
  currentWeek: 7,
  totalWeeks: 21,
  layers: [
    {
      id: "layer-0",
      title: "Layer 0 — Foundation",
      status: "done",
      phases: [
        {
          id: "foundation",
          name: "Architecture + foundation",
          status: "done",
          weeks: "W1–W5",
          steps: [
            "Feature modules, protected APIs",
            "254 passing tests",
            "Prompt injection system",
            "Audio system (C1, C2)",
            "Variation engine",
          ],
          detail:
            "Architectural refactor complete. Feature modules, 254 passing tests, protected APIs, prompt injection, full audio system, content variation engine, AI microservice.",
        },
      ],
    },
    {
      id: "layer-1",
      title: "Layer 1 — Production foundations",
      status: "in-progress",
      phases: [
        {
          id: "u1",
          name: "U1 Universe model",
          status: "done",
          weeks: "W6",
          weekStart: 5,
          weekEnd: 6,
          steps: [
            "Universes table + seed data",
            "universe_id FK on dolls",
            "Admin universe panel",
            "AI UNIVERSE_BLOCK updated",
          ],
          detail:
            "Universes table created. Three universes seeded: Farm World, Little Dreamers, Together World. universe_id foreign key on dolls. Admin panel with list, detail, and doll assignment. AI layer reads real universe data.",
        },
        {
          id: "cb1",
          name: "CB1 Character brief",
          status: "done",
          weeks: "W6",
          weekStart: 5.5,
          weekEnd: 6.5,
          steps: [
            "7 extended fields in Supabase",
            "Admin panel with guidance + counters",
            "Generation payload updated",
          ],
          detail:
            "Seven character brief fields added to dolls table and admin Character stage panel. Each field has guidance text and character limit counter. All fields feed into AI generation payload.",
        },
        {
          id: "cb2",
          name: "CB2 Brief generator",
          status: "done",
          weeks: "W6",
          weekStart: 5.8,
          weekEnd: 6.8,
          steps: [
            "AI task + prompt builder",
            "Normalization + routing",
            "Generate Brief button in admin",
          ],
          detail:
            "AI task character_brief registered. Prompt builder injects CHARACTER_BLOCK and UNIVERSE_BLOCK. Generate Brief button pre-fills all 7 fields from AI output. Operator reviews and saves.",
        },
        {
          id: "sl1",
          name: "SL1 Story library model",
          status: "done",
          weeks: "W7",
          weekStart: 6,
          weekEnd: 7,
          steps: [
            "Universe-linked stories table",
            "doll_stories junction table",
            "Service layer updated",
          ],
          detail:
            "Stories table rebuilt as universe-level objects. doll_stories junction table links stories to dolls. Service layer updated. Existing story editor unchanged.",
        },
      ],
    },
    {
      id: "layer-1b",
      title: "Layer 1b — Rosie reference product",
      status: "next",
      phases: [
        {
          id: "r0",
          name: "R0 Creative foundation",
          status: "in-progress",
          weeks: "W8",
          weekStart: 7,
          weekEnd: 8,
          steps: [
            "Farm World Universe Brief",
            "Rosie's three stories written",
            "Animal characters defined",
            "Voice lines scripted",
            "Rosie's Letter written",
          ],
          detail:
            "All creative work for Rosie and Farm World. No building until this is locked. Output: a complete creative document that every subsequent build phase references.",
        },
        {
          id: "r1",
          name: "R1 Visual assets",
          status: "planned",
          weeks: "W8–W10",
          weekStart: 7.5,
          weekEnd: 10,
          steps: [
            "Rosie illustrated portrait",
            "Farm World backgrounds (5 scenes)",
            "Story beat illustrations",
            "Animal portraits (5 characters)",
          ],
          detail:
            "All visual assets generated from Rosie's photos. Consistent Farm World palette: deep burgundy, soft cream, slate grey, sage green, warm amber.",
        },
        {
          id: "r2",
          name: "R2 Audio assets",
          status: "blocked",
          weeks: "W9–W10",
          weekStart: 8.5,
          weekEnd: 10,
          steps: [
            "Farm World ambient soundscape",
            "Animal sounds (5 characters)",
            "Rosie's voice — ElevenLabs",
          ],
          detail:
            "Blocked on ElevenLabs account setup. Farm World ambient audio can be sourced independently. Voice lines are scripted and ready.",
        },
        {
          id: "sl2",
          name: "SL2 Story builder",
          status: "planned",
          weeks: "W9–W10",
          weekStart: 8.5,
          weekEnd: 10.5,
          steps: [
            "3 story type templates",
            "Story builder UI",
            "Preview + approval + publish",
            "Assign stories to dolls",
          ],
          detail:
            "Three story types: linear 5-beat, branched choice, do-together offline. Builder UI in Content section. Approval workflow. Universe-level story library.",
        },
        {
          id: "al1",
          name: "AL1 Activity system",
          status: "planned",
          weeks: "W10–W11",
          weekStart: 9.5,
          weekEnd: 11.5,
          steps: [
            "Activities data model",
            "4 activity types",
            "Rotating activity slot",
            "Public Activities scene",
          ],
          detail:
            "Four activity types: Tap and Discover, Color and Decorate, Story Choice, Do It With Your Doll. Activities belong to universe, personalized with doll name.",
        },
        {
          id: "ex1",
          name: "EX1 New public scenes",
          status: "planned",
          weeks: "W11–W12",
          weekStart: 10.5,
          weekEnd: 12.5,
          steps: [
            "Welcome — enhanced",
            "The Farm — discovery scene",
            "Meet The Farm — dolls + animals",
            "What's New — retention engine",
            "Rosie's Letter — personal scene",
          ],
          detail:
            "Seven total public scenes. What's New is the most important — shows universe growth to every doll owner. Rosie's Letter is the most personal — direct address to the child who owns her.",
        },
        {
          id: "it1",
          name: "IT1 Items system",
          status: "planned",
          weeks: "W12",
          weekStart: 11.5,
          weekEnd: 12.5,
          steps: [
            "Items data model",
            "Animal + accessory records",
            "Items in Meet The Farm scene",
          ],
          detail:
            "Items are universe citizens, not accessories. Animals have names, portraits, sounds. Appear in stories and Meet The Farm scene.",
        },
        {
          id: "r3",
          name: "R3 Assembly + testing",
          status: "planned",
          weeks: "W13",
          weekStart: 12,
          weekEnd: 13.5,
          steps: [
            "All assets loaded into system",
            "Every scene tested on device",
            "Rosie at Ready status",
            "10 parent test sessions",
          ],
          detail:
            "Rosie fully live. All 7 scenes working. Voice, audio, stories, activities, animals, What's New, Rosie's Letter. Shown to 10 parents for feedback.",
        },
      ],
    },
    {
      id: "layer-2",
      title: "Layer 2 — Operator enablement",
      status: "planned",
      phases: [
        {
          id: "ui1",
          name: "UI1 Admin kanban",
          status: "planned",
          weeks: "W14",
          weekStart: 13,
          weekEnd: 14.5,
          steps: [
            "Board + universe switcher",
            "Doll card + status indicators",
            "Unified doll workspace",
            "Full nav structure",
          ],
          detail:
            "Admin redesigned as operations board. Universe tabs. Doll cards with status indicators. One unified doll workspace replacing current pipeline/studio split.",
        },
        {
          id: "pp1",
          name: "PP1 Physical production",
          status: "planned",
          weeks: "W14",
          weekStart: 13.5,
          weekEnd: 14.5,
          steps: [
            "Production orders table",
            "Workshop board",
            "Quality gate + check-in flow",
          ],
          detail:
            "Layer 2 tracking. Specs to artist, in production, received, quality check, check-in. Passing QC pushes doll into digital production pipeline.",
        },
        {
          id: "op1",
          name: "OP1 Roles + permissions",
          status: "planned",
          weeks: "W15",
          weekStart: 14,
          weekEnd: 15.5,
          steps: [
            "Collaborator role",
            "Admin role",
            "Audit log",
          ],
          detail:
            "Two roles: admin (full access) and collaborator (create/edit, cannot delete or change commerce status). Audit log of who changed what.",
        },
        {
          id: "op2",
          name: "OP2 Review workflow",
          status: "planned",
          weeks: "W15",
          weekStart: 14.5,
          weekEnd: 15.5,
          steps: [
            "Per-asset approve / reject",
            "Asset locking after approval",
          ],
          detail:
            "Content management statuses drive a structured review UI. Approved assets locked from regeneration unless explicitly reopened.",
        },
      ],
    },
    {
      id: "layer-3",
      title: "Layer 3 — Content and marketing",
      status: "planned",
      phases: [
        {
          id: "lu1",
          name: "LU1 Living universe",
          status: "planned",
          weeks: "W16",
          weekStart: 15,
          weekEnd: 16.5,
          steps: [
            "New arrivals system",
            "Content scope model",
            "Universe growth engine",
          ],
          detail:
            "Every new doll and story arrival is announced across all doll pages in that universe. The What's New scene becomes a live feed.",
        },
        {
          id: "sm1",
          name: "SM1 Social media layer",
          status: "planned",
          weeks: "W17–W18",
          weekStart: 16,
          weekEnd: 18.5,
          steps: [
            "Content calendar",
            "Publishing workflow",
            "Buffer / Later integration",
          ],
          detail:
            "Social content generated in digital production pushed to scheduling queue. Operator reviews and publishes from within the system.",
        },
        {
          id: "mk1",
          name: "MK1 Marketing strategy",
          status: "planned",
          weeks: "W18",
          weekStart: 17.5,
          weekEnd: 18.5,
          steps: [
            "Content pillars per universe",
            "Instagram strategy session",
            "Hashtag + growth plan",
          ],
          detail:
            "Dedicated planning session with Claude. Full Instagram strategy built after production system is operational and producing consistent content.",
        },
      ],
    },
    {
      id: "layer-4",
      title: "Layer 4 — Scale",
      status: "planned",
      phases: [
        {
          id: "sh1",
          name: "SH1 Online shop",
          status: "planned",
          weeks: "W19+",
          weekStart: 18.5,
          weekEnd: 20,
          steps: [
            "Waitlist + reservation model",
            "Product pages",
            "Payment + order management",
          ],
          detail:
            "Not a standard shop — a waitlist and reservation model matching the handmade reality. Parents register interest, receive notification when a doll is available, reserve within a window.",
        },
        {
          id: "crm",
          name: "CRM + Analytics",
          status: "planned",
          weeks: "W20+",
          weekStart: 19.5,
          weekEnd: 21,
          steps: [
            "Customer records",
            "Order tracking",
            "Plausible analytics",
          ],
          detail:
            "Customer management separate from production readiness. Plausible for privacy-respecting analytics.",
        },
        {
          id: "lab",
          name: "LAB Creative lab",
          status: "planned",
          weeks: "W21+",
          weekStart: 20,
          weekEnd: 21,
          steps: [
            "AI concept generation",
            "Doll brief from scratch",
            "Universe design tools",
          ],
          detail:
            "Layer 1 fully operational. AI-assisted concept generation for universes and doll briefs. Creative director makes all decisions.",
        },
      ],
    },
  ],
};
