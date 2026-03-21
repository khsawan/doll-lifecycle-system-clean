"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function DollPublicPage() {
  const params = useParams();

  const slug = useMemo(() => {
    if (!params?.slug) return "";
    return Array.isArray(params.slug) ? params.slug[0] : params.slug;
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [doll, setDoll] = useState(null);
  const [story, setStory] = useState({
    teaser: "",
    mainStory: "",
    mini1: "",
    mini2: "",
  });
  const [viewportWidth, setViewportWidth] = useState(1200);

  const isMobile = viewportWidth < 760;
  const isTablet = viewportWidth >= 760 && viewportWidth < 1100;

  useEffect(() => {
    function handleResize() {
      setViewportWidth(window.innerWidth);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    async function loadPage() {
      if (!slug) return;

      setLoading(true);
      setError("");

      const { data: dollRow, error: dollError } = await supabase
        .from("dolls")
        .select("*")
        .eq("slug", slug)
        .single();

      if (dollError || !dollRow) {
        setError("This doll page could not be found.");
        setDoll(null);
        setLoading(false);
        return;
      }

      setDoll(dollRow);

      const { data: stories } = await supabase
        .from("stories")
        .select("*")
        .eq("doll_id", dollRow.id)
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

      setLoading(false);
    }

    loadPage();
  }, [slug]);

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>
          <div style={brandStyle}>MAILLE & MERVEILLE</div>
          <div style={loadingCardStyle}>Loading doll story...</div>
        </div>
      </main>
    );
  }

  if (error || !doll) {
    return (
      <main style={pageStyle}>
        <div style={shellStyle}>
          <div style={brandStyle}>MAILLE & MERVEILLE</div>
          <div style={errorCardStyle}>
            <h1 style={{ margin: "0 0 12px", fontSize: 28 }}>Doll page unavailable</h1>
            <p style={{ margin: 0, color: "#64748b", lineHeight: 1.8 }}>
              {error || "We could not load this doll page right now."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const heroTitleSize = isMobile ? 48 : isTablet ? 62 : 76;
  const heroPadding = isMobile ? 18 : 26;
  const sectionPadding = isMobile ? 18 : 24;

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <div style={brandStyle}>MAILLE & MERVEILLE</div>

        <section
          style={{
            ...heroCardStyle,
            padding: heroPadding,
          }}
        >
          {isMobile ? (
            <div style={mobileHeroStackStyle}>
              <div style={heroMetaRowMobileStyle}>
                <div style={heroBadgeStyle}>{doll.theme_name || "Unassigned"}</div>
                {doll.internal_id ? <div style={heroInternalIdStyle}>{doll.internal_id}</div> : null}
              </div>

              <h1
                style={{
                  ...heroTitleStyle,
                  fontSize: heroTitleSize,
                  textAlign: "center",
                  marginBottom: 12,
                }}
              >
                {doll.name || "Handmade Doll"}
              </h1>

              {doll.image_url ? (
                <div style={mobileImageOuterStyle}>
                  <div style={mobileImageFrameStyle}>
                    <img
                      src={doll.image_url}
                      alt={doll.name || "Doll"}
                      style={mobileHeroImageStyle}
                    />
                  </div>
                </div>
              ) : (
                <div style={mobileImageOuterStyle}>
                  <div style={mobileImageFrameStyle}>
                    <div style={heroImageFallbackStyle}>
                      <div style={heroImageFallbackTitleStyle}>{doll.name || "This Doll"}</div>
                      <div style={heroImageFallbackTextStyle}>
                        A handmade character page with a story to discover.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <p style={mobileIntroStyle}>
                {doll.short_intro || "A one-of-a-kind handmade doll with a story to discover."}
              </p>

              {story.teaser ? <div style={mobileTeaserBoxStyle}>{story.teaser}</div> : null}

              {doll.emotional_hook ? (
                <div style={mobileHeartBoxStyle}>
                  <div style={mobileHeartLabelStyle}>Character Heart</div>
                  <div style={mobileHeartTextStyle}>{doll.emotional_hook}</div>
                </div>
              ) : null}
            </div>
          ) : (
            <div
              style={{
                ...heroGridStyle,
                gridTemplateColumns: isTablet ? "1fr 1fr" : "1.08fr 0.92fr",
              }}
            >
              <div style={heroTextColumnStyle}>
                <div style={heroMetaRowStyle}>
                  <div style={heroBadgeStyle}>{doll.theme_name || "Unassigned"}</div>
                  {doll.internal_id ? <div style={heroInternalIdStyle}>{doll.internal_id}</div> : null}
                </div>

                <h1
                  style={{
                    ...heroTitleStyle,
                    fontSize: heroTitleSize,
                    textAlign: "left",
                  }}
                >
                  {doll.name || "Handmade Doll"}
                </h1>

                <p style={heroIntroStyle}>
                  {doll.short_intro || "A one-of-a-kind handmade doll with a story to discover."}
                </p>

                {story.teaser ? <div style={teaserBoxStyle}>{story.teaser}</div> : null}

                {doll.emotional_hook ? (
                  <div style={heroInfoPillsStyle}>
                    <div style={infoPillStyle}>
                      <span style={infoPillLabelStyle}>Character Heart</span>
                      <span>{doll.emotional_hook}</span>
                    </div>
                  </div>
                ) : null}
              </div>

              <div style={heroVisualColumnStyle}>
                <div style={heroImageFrameStyle}>
                  {doll.image_url ? (
                    <img
                      src={doll.image_url}
                      alt={doll.name || "Doll"}
                      style={{
                        ...heroImageStyle,
                        height: isTablet ? 430 : 520,
                      }}
                    />
                  ) : (
                    <div style={heroImageFallbackStyle}>
                      <div style={heroImageFallbackTitleStyle}>{doll.name || "This Doll"}</div>
                      <div style={heroImageFallbackTextStyle}>
                        A handmade character page with a story to discover.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        <section
          style={{
            ...contentGridStyle,
            gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "1.42fr 0.92fr",
          }}
        >
          <div style={mainColumnStyle}>
            <div
              style={{
                ...sectionCardStyle,
                padding: sectionPadding,
              }}
            >
              <div style={sectionLabelStyle}>Main Story</div>
              <div
                style={{
                  ...storyTextStyle,
                  fontSize: isMobile ? 17 : 18,
                }}
              >
                {story.mainStory || "This doll's full story is coming soon."}
              </div>
            </div>

            {story.mini1 || story.mini2 ? (
              <div
                style={{
                  ...sectionCardStyle,
                  padding: sectionPadding,
                }}
              >
                <div style={sectionLabelStyle}>Little Story Moments</div>

                <div
                  style={{
                    ...miniGridStyle,
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                  }}
                >
                  {story.mini1 ? (
                    <div style={miniCardStyle}>
                      <div style={miniTitleStyle}>Story Moment 1</div>
                      <div style={miniTextStyle}>{story.mini1}</div>
                    </div>
                  ) : null}

                  {story.mini2 ? (
                    <div style={miniCardStyle}>
                      <div style={miniTitleStyle}>Story Moment 2</div>
                      <div style={miniTextStyle}>{story.mini2}</div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <aside style={sideColumnStyle}>
            <div
              style={{
                ...sectionCardStyle,
                padding: sectionPadding,
              }}
            >
              <div style={sectionLabelStyle}>About This Doll</div>

              <div style={infoListStyle}>
                <div style={infoRowStyle}>
                  <div style={infoKeyStyle}>Name</div>
                  <div style={infoValueStyle}>{doll.name || "—"}</div>
                </div>

                <div style={infoRowStyle}>
                  <div style={infoKeyStyle}>Theme</div>
                  <div style={infoValueStyle}>{doll.theme_name || "Unassigned"}</div>
                </div>

                <div style={infoRowStyle}>
                  <div style={infoKeyStyle}>Character Heart</div>
                  <div style={infoValueStyle}>
                    {doll.emotional_hook || "A gentle handmade friend with a meaningful story."}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                ...sectionCardStyle,
                padding: sectionPadding,
              }}
            >
              <div style={sectionLabelStyle}>A Handmade World</div>
              <p style={sideTextStyle}>
                Every Maille & Merveille doll is imagined as more than an object — each one carries a small world,
                a mood, and a story waiting to be felt.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #f8fafc 0%, #fffaf5 100%)",
  padding: "20px 12px 56px",
  fontFamily: "Inter, Arial, sans-serif",
  color: "#0f172a",
};

const shellStyle = {
  maxWidth: 1160,
  margin: "0 auto",
};

const brandStyle = {
  letterSpacing: "0.2em",
  fontSize: 12,
  color: "#64748b",
  marginBottom: 16,
  textAlign: "center",
};

const heroCardStyle = {
  background: "rgba(255,255,255,0.94)",
  border: "1px solid #e5e7eb",
  borderRadius: 32,
  boxShadow: "0 18px 48px rgba(15, 23, 42, 0.06)",
};

const heroGridStyle = {
  display: "grid",
  gap: 28,
  alignItems: "center",
};

const heroTextColumnStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
};

const heroMetaRowStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
  marginBottom: 18,
};

const heroMetaRowMobileStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 12,
};

const heroBadgeStyle = {
  display: "inline-block",
  background: "#f8fafc",
  border: "1px solid #dbeafe",
  color: "#475569",
  borderRadius: 999,
  padding: "9px 15px",
  fontSize: 13,
};

const heroInternalIdStyle = {
  display: "inline-block",
  background: "#fffaf5",
  border: "1px solid #f5d0a9",
  color: "#9a3412",
  borderRadius: 999,
  padding: "9px 15px",
  fontSize: 12,
  letterSpacing: "0.05em",
};

const heroTitleStyle = {
  lineHeight: 0.95,
  margin: "0 0 18px",
  fontWeight: 800,
  letterSpacing: "-0.04em",
  color: "#16213b",
};

const heroIntroStyle = {
  margin: 0,
  color: "#475569",
  fontSize: 20,
  lineHeight: 1.8,
  maxWidth: 560,
};

const heroInfoPillsStyle = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 18,
};

const infoPillStyle = {
  display: "inline-flex",
  flexDirection: "column",
  gap: 4,
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: "12px 14px",
  color: "#334155",
  maxWidth: 360,
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.04)",
};

const infoPillLabelStyle = {
  fontSize: 11,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#94a3b8",
  fontWeight: 700,
};

const teaserBoxStyle = {
  marginTop: 22,
  background: "#fff7ed",
  border: "1px solid #fed7aa",
  borderRadius: 22,
  padding: 18,
  color: "#9a3412",
  fontSize: 16,
  lineHeight: 1.8,
  width: "100%",
  boxSizing: "border-box",
};

const heroVisualColumnStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const heroImageFrameStyle = {
  width: "100%",
  maxWidth: 440,
  background: "linear-gradient(180deg, #fffaf5 0%, #f8fafc 100%)",
  border: "1px solid #e5e7eb",
  borderRadius: 30,
  padding: 14,
  boxShadow: "0 18px 44px rgba(15, 23, 42, 0.08)",
};

const heroImageStyle = {
  width: "100%",
  display: "block",
  objectFit: "cover",
  borderRadius: 22,
};

const heroImageFallbackStyle = {
  minHeight: 320,
  borderRadius: 22,
  border: "1px dashed #cbd5e1",
  background: "linear-gradient(135deg, #f5efe6 0%, #f1f5f9 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  textAlign: "center",
  padding: 24,
};

const heroImageFallbackTitleStyle = {
  fontSize: 24,
  fontWeight: 700,
  marginBottom: 8,
  color: "#0f172a",
};

const heroImageFallbackTextStyle = {
  color: "#64748b",
  lineHeight: 1.7,
  maxWidth: 240,
};

const mobileHeroStackStyle = {
  display: "grid",
  gap: 14,
};

const mobileImageOuterStyle = {
  width: "100%",
  marginTop: 4,
};

const mobileImageFrameStyle = {
  width: "100%",
  background: "linear-gradient(180deg, #fffaf5 0%, #f8fafc 100%)",
  border: "1px solid #e5e7eb",
  borderRadius: 24,
  padding: 10,
  boxShadow: "0 14px 30px rgba(15, 23, 42, 0.08)",
  boxSizing: "border-box",
};

const mobileHeroImageStyle = {
  width: "100%",
  height: 300,
  display: "block",
  objectFit: "cover",
  borderRadius: 18,
};

const mobileIntroStyle = {
  margin: "2px 0 0",
  color: "#475569",
  fontSize: 17,
  lineHeight: 1.75,
  textAlign: "center",
};

const mobileTeaserBoxStyle = {
  background: "#fff7ed",
  border: "1px solid #fed7aa",
  borderRadius: 18,
  padding: 14,
  color: "#9a3412",
  fontSize: 15,
  lineHeight: 1.75,
  textAlign: "center",
};

const mobileHeartBoxStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 14,
  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.04)",
  textAlign: "center",
};

const mobileHeartLabelStyle = {
  fontSize: 11,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#94a3b8",
  fontWeight: 700,
  marginBottom: 6,
};

const mobileHeartTextStyle = {
  color: "#334155",
  lineHeight: 1.7,
};

const contentGridStyle = {
  display: "grid",
  gap: 22,
  marginTop: 24,
};

const mainColumnStyle = {
  display: "grid",
  gap: 22,
};

const sideColumnStyle = {
  display: "grid",
  gap: 22,
};

const sectionCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 30,
  boxShadow: "0 12px 36px rgba(15, 23, 42, 0.04)",
};

const sectionLabelStyle = {
  fontSize: 12,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "#94a3b8",
  marginBottom: 14,
  fontWeight: 700,
};

const storyTextStyle = {
  fontSize: 18,
  lineHeight: 2,
  color: "#334155",
  whiteSpace: "pre-wrap",
  letterSpacing: "0.01em",
};

const miniGridStyle = {
  display: "grid",
  gap: 16,
};

const miniCardStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 22,
  padding: 18,
};

const miniTitleStyle = {
  fontWeight: 700,
  marginBottom: 8,
  color: "#0f172a",
};

const miniTextStyle = {
  color: "#475569",
  lineHeight: 1.9,
  fontSize: 16,
  letterSpacing: "0.01em",
};

const infoListStyle = {
  display: "grid",
  gap: 16,
};

const infoRowStyle = {
  paddingBottom: 14,
  borderBottom: "1px solid #f1f5f9",
};

const infoKeyStyle = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#94a3b8",
  marginBottom: 6,
  fontWeight: 700,
};

const infoValueStyle = {
  color: "#334155",
  lineHeight: 1.8,
  fontSize: 16,
};

const sideTextStyle = {
  margin: 0,
  color: "#475569",
  lineHeight: 1.9,
};

const loadingCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 28,
  padding: 32,
  textAlign: "center",
  color: "#64748b",
  fontSize: 18,
};

const errorCardStyle = {
  background: "#ffffff",
  border: "1px solid #fecaca",
  borderRadius: 28,
  padding: 28,
  textAlign: "center",
};