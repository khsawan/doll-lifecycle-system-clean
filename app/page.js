"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const DEFAULT_THEMES = ["Unassigned", "Nature Friends", "Little Dreamers", "Cozy World"];
const STATUSES = ["new", "identity", "story", "digital", "content", "sales", "live"];
const STORY_TONES = ["Gentle", "Playful", "Magical"];

function slugify(value) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function progressFromStatus(status) {
  const idx = STATUSES.indexOf(status || "new");
  return Math.max(13, Math.round(((Math.max(idx, 0) + 1) / STATUSES.length) * 100));
}

function statusLabel(status) {
  if (!status) return "New";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function cleanList(value) {
  return (value || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function buildStoryPack(doll, tone) {
  const name = doll.name || "This doll";
  const theme = doll.theme_name || "Unassigned";
  const traits = cleanList(doll.personality_traits);
  const traitText = traits.length ? traits.slice(0, 3).join(", ") : "gentle, curious, and kind";
  const hook = doll.emotional_hook || `${name} brings warmth and wonder wherever she goes`;
  const intro = doll.short_intro || `${name} turns ordinary moments into soft little stories.`;

  const openers = {
    Gentle: `${name} loves the quiet beauty of small moments and always notices when someone needs comfort.`,
    Playful: `${name} can turn the simplest day into a happy little adventure full of laughter and surprises.`,
    Magical: `${name} moves through the world as if every breeze, flower, and sunrise is holding a tiny secret.`,
  };

  const bridges = {
    Gentle: `With a ${traitText} heart, ${name} makes every place feel softer and safer.`,
    Playful: `With a ${traitText} spirit, ${name} fills the day with smiles, games, and bright ideas.`,
    Magical: `With a ${traitText} spirit, ${name} finds wonder hidden in the smallest details.`,
  };

  const closers = {
    Gentle: `By the end of each day, ${name} leaves a little more kindness behind.`,
    Playful: `${name} always finds a new reason to smile before the sun goes down.`,
    Magical: `Wherever ${name} goes, a little bit of wonder seems to stay behind.`,
  };

  const teaser =
    tone === "Magical"
      ? `Meet ${name}, a one-of-a-kind friend who turns everyday moments into tiny pieces of magic.`
      : tone === "Playful"
        ? `Meet ${name}, a one-of-a-kind friend who makes every day feel brighter, happier, and full of adventure.`
        : `Meet ${name}, a one-of-a-kind friend whose gentle heart makes everyday moments feel warm and special.`;

  const mainStory = `${openers[tone]} ${intro} ${bridges[tone]} In the ${theme} world, ${name} shows that ${hook.charAt(0).toLowerCase() + hook.slice(1)}. ${closers[tone]}`;

  const mini1 =
    tone === "Playful"
      ? `${name} once turned an ordinary afternoon into a tiny celebration with a clever game and a big smile.`
      : tone === "Magical"
        ? `${name} once followed a golden breeze and discovered that even a quiet afternoon can feel enchanted.`
        : `${name} once turned an ordinary afternoon into a calm little memory that everyone wanted to keep.`;

  const mini2 =
    tone === "Playful"
      ? `${name} notices the little things others miss and always finds a fun way to make them shine.`
      : tone === "Magical"
        ? `${name} notices the smallest details and treats them like little treasures from a hidden story.`
        : `${name} notices the small things others forget and makes them feel important again.`;

  return {
    teaser,
    mainStory,
    mini1,
    mini2,
    slug: slugify(name),
  };
}

export default function Page() {
  const [themes, setThemes] = useState(DEFAULT_THEMES);
  const [dolls, setDolls] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [newDollName, setNewDollName] = useState("");
  const [newArtistName, setNewArtistName] = useState("");
  const [newTheme, setNewTheme] = useState("Unassigned");

  const [identity, setIdentity] = useState({
    name: "",
    theme_name: "Unassigned",
    personality_traits: "",
    emotional_hook: "",
    short_intro: "",
  });

  const [storyTone, setStoryTone] = useState("Gentle");
  const [story, setStory] = useState({
    teaser: "",
    mainStory: "",
    mini1: "",
    mini2: "",
  });

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("identity");

  const selected = useMemo(
    () => dolls.find((d) => d.id === selectedId) || dolls[0] || null,
    [dolls, selectedId]
  );

  async function loadThemes() {
    const { data } = await supabase.from("themes").select("name").order("name");
    const dbThemes = (data || []).map((x) => x.name).filter(Boolean);
    const merged = Array.from(new Set(["Unassigned", ...dbThemes, ...DEFAULT_THEMES]));
    setThemes(merged);
  }

  async function loadDolls() {
    const { data, error } = await supabase.from("dolls").select("*").order("created_at", { ascending: true });
    if (error) {
      setError(error.message);
      return;
    }
    const mapped = (data || []).map((d) => ({
      ...d,
      theme_name: d.theme_name || "Unassigned",
    }));
    setDolls(mapped);
    if (!selectedId && mapped.length) setSelectedId(mapped[0].id);
  }

  async function loadDetails(dollId) {
    if (!dollId) return;
    setError("");
    const doll = dolls.find((d) => d.id === dollId);
    if (doll) {
      setIdentity({
        name: doll.name || "",
        theme_name: doll.theme_name || "Unassigned",
        personality_traits: doll.personality_traits || "",
        emotional_hook: doll.emotional_hook || "",
        short_intro: doll.short_intro || "",
      });
    }

    const { data: stories } = await supabase
      .from("stories")
      .select("*")
      .eq("doll_id", dollId)
      .order("sequence_order", { ascending: true });

    const teaser = (stories || []).find((s) => s.type === "teaser")?.content || "";
    const mainStory = (stories || []).find((s) => s.type === "main")?.content || "";
    const minis = (stories || []).filter((s) => s.type === "mini");
    setStory({
      teaser,
      mainStory,
      mini1: minis[0]?.content || "",
      mini2: minis[1]?.content || "",
    });
  }

  useEffect(() => {
    loadThemes();
    loadDolls();
  }, []);

  useEffect(() => {
    if (selected) loadDetails(selected.id);
  }, [selectedId, dolls.length]);

  async function createDoll() {
    setError("");
    setNotice("");
    const count = dolls.length + 1;
    const payload = {
      internal_id: `DOLL-${String(count).padStart(3, "0")}`,
      name: newDollName || `DOLL-${String(count).padStart(3, "0")}`,
      artist_name: newArtistName || null,
      theme_name: newTheme || "Unassigned",
      status: "new",
      availability_status: "available",
      sales_status: "not_sold",
      slug: slugify(newDollName || `DOLL-${String(count).padStart(3, "0")}`),
    };
    const { data, error } = await supabase.from("dolls").insert(payload).select().single();
    if (error) {
      setError(error.message);
      return;
    }
    const next = {
      ...data,
      theme_name: data.theme_name || "Unassigned",
    };
    setDolls((prev) => [...prev, next]);
    setSelectedId(next.id);
    setNewDollName("");
    setNewArtistName("");
    setNewTheme("Unassigned");
    setNotice("New doll added to the pipeline.");
  }

  async function saveIdentity() {
    if (!selected) return;
    setError("");
    setNotice("");
    const patch = {
      name: identity.name,
      theme_name: identity.theme_name,
      personality_traits: identity.personality_traits,
      emotional_hook: identity.emotional_hook,
      short_intro: identity.short_intro,
      slug: slugify(identity.name || selected.internal_id),
      status: selected.status === "new" ? "identity" : selected.status,
    };
    const { error } = await supabase.from("dolls").update(patch).eq("id", selected.id);
    if (error) {
      setError(error.message);
      return;
    }
    setDolls((prev) =>
      prev.map((d) => (d.id === selected.id ? { ...d, ...patch } : d))
    );
    setNotice("Identity saved.");
  }

  async function saveStory() {
    if (!selected) return;
    setError("");
    setNotice("");

    await supabase.from("stories").delete().eq("doll_id", selected.id);

    const inserts = [
      { doll_id: selected.id, type: "teaser", title: "Card teaser", content: story.teaser, sequence_order: 1 },
      { doll_id: selected.id, type: "main", title: "Main story", content: story.mainStory, sequence_order: 2 },
      { doll_id: selected.id, type: "mini", title: "Mini story 1", content: story.mini1, sequence_order: 3 },
      { doll_id: selected.id, type: "mini", title: "Mini story 2", content: story.mini2, sequence_order: 4 },
    ].filter((x) => (x.content || "").trim());

    const { error } = await supabase.from("stories").insert(inserts);
    if (error) {
      setError(error.message);
      return;
    }

    const { error: dollError } = await supabase
      .from("dolls")
      .update({ status: "story" })
      .eq("id", selected.id);

    if (dollError) {
      setError(dollError.message);
      return;
    }

    setDolls((prev) =>
      prev.map((d) => (d.id === selected.id ? { ...d, status: "story" } : d))
    );
    setNotice("Story saved.");
  }

  function applyTone(tone) {
    setStoryTone(tone);
    if (!selected) return;
    const pack = buildStoryPack({ ...selected, ...identity }, tone);
    setStory({
      teaser: pack.teaser,
      mainStory: pack.mainStory,
      mini1: pack.mini1,
      mini2: pack.mini2,
    });
    setNotice(`${tone} story pack generated.`);
  }

  async function advanceStage() {
    if (!selected) return;
    const idx = STATUSES.indexOf(selected.status || "new");
    const next = STATUSES[Math.min(idx + 1, STATUSES.length - 1)];
    const { error } = await supabase.from("dolls").update({ status: next }).eq("id", selected.id);
    if (error) {
      setError(error.message);
      return;
    }
    setDolls((prev) => prev.map((d) => (d.id === selected.id ? { ...d, status: next } : d)));
    setNotice(`Advanced to ${statusLabel(next)}.`);
  }

  function generateDraft() {
    if (!selected) return;
    const pack = buildStoryPack({ ...selected, ...identity }, storyTone);
    setStory({
      teaser: pack.teaser,
      mainStory: pack.mainStory,
      mini1: pack.mini1,
      mini2: pack.mini2,
    });
    setNotice("Draft generated.");
  }

  const metrics = {
    total: dolls.length,
    live: dolls.filter((d) => d.status === "live").length,
    available: dolls.filter((d) => d.availability_status === "available").length,
    sold: dolls.filter((d) => d.sales_status === "sold").length,
  };

  return (
    <main style={{ background: "#f6f7fb", minHeight: "100vh", padding: 32, fontFamily: "Inter, Arial, sans-serif", color: "#0f172a" }}>
      <div style={{ maxWidth: 1220, margin: "0 auto" }}>
        <div style={{ letterSpacing: 3, fontSize: 14, color: "#64748b", marginBottom: 8 }}>MAILLE & MERVEILLE</div>
        <h1 style={{ fontSize: 50, margin: 0, lineHeight: 1.05 }}>Doll Lifecycle System</h1>
        <p style={{ fontSize: 18, color: "#475569", maxWidth: 860, marginTop: 12 }}>
          A full internal pipeline that transforms every handmade doll into a character, a living digital story asset, and a scalable brand node.
        </p>

        {notice ? (
          <div style={{ marginTop: 24, background: "#dff5e7", border: "1px solid #9fe0b4", color: "#166534", padding: 16, borderRadius: 16 }}>
            {notice}
          </div>
        ) : null}

        {error ? (
          <div style={{ marginTop: 24, background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: 16, borderRadius: 16 }}>
            {error}
          </div>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginTop: 28 }}>
          {[
            ["Total Dolls", metrics.total],
            ["Live Worlds", metrics.live],
            ["Available", metrics.available],
            ["Sold", metrics.sold],
          ].map(([label, value]) => (
            <div key={label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 22, padding: 24 }}>
              <div style={{ color: "#64748b", fontSize: 16 }}>{label}</div>
              <div style={{ fontSize: 42, marginTop: 10, fontWeight: 700 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 24, marginTop: 28 }}>
          <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 28, padding: 22 }}>
            <h2 style={{ marginTop: 0, fontSize: 24 }}>Pipeline Control</h2>

            <div style={{ marginTop: 20 }}>
              <label style={{ display: "block", fontSize: 14, color: "#475569", marginBottom: 8 }}>Doll name or temporary label</label>
              <input value={newDollName} onChange={(e) => setNewDollName(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ display: "block", fontSize: 14, color: "#475569", marginBottom: 8 }}>Artist name</label>
              <input value={newArtistName} onChange={(e) => setNewArtistName(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ display: "block", fontSize: 14, color: "#475569", marginBottom: 8 }}>Theme</label>
              <select value={newTheme} onChange={(e) => setNewTheme(e.target.value)} style={inputStyle}>
                {themes.map((theme) => (
                  <option key={theme} value={theme}>
                    {theme}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button onClick={createDoll} style={primaryButton}>Create Intake Entry</button>
              <button onClick={() => { loadThemes(); loadDolls(); }} style={secondaryButton}>Refresh</button>
            </div>

            <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 22, paddingTop: 18 }}>
              <div style={{ color: "#64748b", marginBottom: 14 }}>Dolls</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {dolls.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedId(d.id)}
                    style={{
                      textAlign: "left",
                      border: selected?.id === d.id ? "2px solid #0f172a" : "1px solid #cbd5e1",
                      background: "#fff",
                      borderRadius: 20,
                      padding: 16,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 18 }}>{d.name}</div>
                        <div style={{ color: "#64748b", marginTop: 4 }}>{d.internal_id} · {d.theme_name || "Unassigned"}</div>
                      </div>
                      <div style={{ background: "#eef2ff", color: "#0f172a", borderRadius: 999, padding: "6px 12px", fontSize: 14 }}>
                        {statusLabel(d.status)}
                      </div>
                    </div>
                    <div style={{ marginTop: 14, height: 8, background: "#e2e8f0", borderRadius: 999 }}>
                      <div style={{ width: `${progressFromStatus(d.status)}%`, height: "100%", background: "#0f172a", borderRadius: 999 }} />
                    </div>
                    <div style={{ marginTop: 8, color: "#64748b", fontSize: 14 }}>{progressFromStatus(d.status)}% through lifecycle</div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 28, padding: 22 }}>
            {selected ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start" }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 28 }}>{selected.name}</h2>
                    <div style={{ color: "#64748b", marginTop: 6 }}>{selected.internal_id} · {identity.theme_name || "Unassigned"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button onClick={generateDraft} style={secondaryButton}>Generate Draft</button>
                    <button onClick={advanceStage} style={primaryButton}>Advance Stage</button>
                  </div>
                </div>

                <div style={{ marginTop: 14, color: "#475569" }}>Lifecycle progress: {progressFromStatus(selected.status)}%</div>
                <div style={{ marginTop: 8, height: 8, background: "#e2e8f0", borderRadius: 999 }}>
                  <div style={{ width: `${progressFromStatus(selected.status)}%`, height: "100%", background: "#0f172a", borderRadius: 999 }} />
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
                  {["identity", "story", "digital", "content", "sales", "live"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        padding: "12px 18px",
                        borderRadius: 16,
                        border: activeTab === tab ? "1px solid #0f172a" : "1px solid #cbd5e1",
                        background: activeTab === tab ? "#0f172a" : "#fff",
                        color: activeTab === tab ? "#fff" : "#0f172a",
                        cursor: "pointer",
                        fontSize: 16,
                      }}
                    >
                      {statusLabel(tab)}
                    </button>
                  ))}
                </div>

                {activeTab === "identity" ? (
                  <div style={{ marginTop: 24 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <label style={labelStyle}>Name</label>
                        <input value={identity.name} onChange={(e) => setIdentity({ ...identity, name: e.target.value })} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Theme</label>
                        <select value={identity.theme_name} onChange={(e) => setIdentity({ ...identity, theme_name: e.target.value })} style={inputStyle}>
                          {themes.map((theme) => (
                            <option key={theme} value={theme}>{theme}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Personality traits</label>
                        <input value={identity.personality_traits} onChange={(e) => setIdentity({ ...identity, personality_traits: e.target.value })} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Emotional hook</label>
                        <input value={identity.emotional_hook} onChange={(e) => setIdentity({ ...identity, emotional_hook: e.target.value })} style={inputStyle} />
                      </div>
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <label style={labelStyle}>Short intro</label>
                      <textarea
                        value={identity.short_intro}
                        onChange={(e) => setIdentity({ ...identity, short_intro: e.target.value })}
                        style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
                      />
                    </div>

                    <div style={{ marginTop: 18 }}>
                      <button onClick={saveIdentity} style={primaryButton}>Save Identity</button>
                    </div>
                  </div>
                ) : null}

                {activeTab === "story" ? (
                  <div style={{ marginTop: 24 }}>
                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 20, padding: 16, marginBottom: 20 }}>
                      <div style={{ fontWeight: 700, marginBottom: 12 }}>Story Engine v2</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        <label style={{ color: "#475569" }}>Tone</label>
                        <select value={storyTone} onChange={(e) => setStoryTone(e.target.value)} style={{ ...inputStyle, width: 180 }}>
                          {STORY_TONES.map((tone) => (
                            <option key={tone} value={tone}>{tone}</option>
                          ))}
                        </select>
                        <button onClick={() => applyTone("Gentle")} style={secondaryButton}>Gentle</button>
                        <button onClick={() => applyTone("Playful")} style={secondaryButton}>Playful</button>
                        <button onClick={() => applyTone("Magical")} style={secondaryButton}>Magical</button>
                        <button onClick={() => applyTone(storyTone)} style={primaryButton}>Generate Story Pack</button>
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>Card teaser</label>
                      <textarea value={story.teaser} onChange={(e) => setStory({ ...story, teaser: e.target.value })} style={{ ...inputStyle, minHeight: 120 }} />
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <label style={labelStyle}>Main story</label>
                      <textarea value={story.mainStory} onChange={(e) => setStory({ ...story, mainStory: e.target.value })} style={{ ...inputStyle, minHeight: 120 }} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
                      <div>
                        <label style={labelStyle}>Mini story 1</label>
                        <textarea value={story.mini1} onChange={(e) => setStory({ ...story, mini1: e.target.value })} style={{ ...inputStyle, minHeight: 120 }} />
                      </div>
                      <div>
                        <label style={labelStyle}>Mini story 2</label>
                        <textarea value={story.mini2} onChange={(e) => setStory({ ...story, mini2: e.target.value })} style={{ ...inputStyle, minHeight: 120 }} />
                      </div>
                    </div>

                    <div style={{ marginTop: 18 }}>
                      <button onClick={saveStory} style={primaryButton}>Save Story</button>
                    </div>
                  </div>
                ) : null}

                {activeTab !== "identity" && activeTab !== "story" ? (
                  <div style={{ marginTop: 24, padding: 20, border: "1px dashed #cbd5e1", borderRadius: 18, color: "#64748b" }}>
                    {statusLabel(activeTab)} module is ready for the next build step.
                  </div>
                ) : null}
              </>
            ) : (
              <div style={{ color: "#64748b" }}>Create your first doll to begin.</div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 14,
  color: "#475569",
  marginBottom: 8,
};

const inputStyle = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 16,
  padding: "14px 16px",
  fontSize: 16,
  outline: "none",
  boxSizing: "border-box",
  background: "#fff",
};

const primaryButton = {
  background: "#0f172a",
  color: "#fff",
  border: "none",
  borderRadius: 16,
  padding: "14px 18px",
  fontSize: 16,
  cursor: "pointer",
};

const secondaryButton = {
  background: "#e2e8f0",
  color: "#0f172a",
  border: "none",
  borderRadius: 16,
  padding: "14px 18px",
  fontSize: 16,
  cursor: "pointer",
};
