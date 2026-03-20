import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

async function getDollData(slug) {
  const { data: doll, error: dollError } = await supabase
    .from("dolls")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (dollError || !doll) {
    return null;
  }

  const { data: stories } = await supabase
    .from("stories")
    .select("*")
    .eq("doll_id", doll.id)
    .order("sequence_order", { ascending: true });

  const teaser = (stories || []).find((s) => s.type === "teaser")?.content || "";
  const mainStory = (stories || []).find((s) => s.type === "main")?.content || "";
  const miniStories = (stories || []).filter((s) => s.type === "mini");

  return {
    doll,
    teaser,
    mainStory,
    miniStories,
  };
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const result = await getDollData(resolvedParams.slug);

  if (!result) {
    return {
      title: "Doll Not Found",
    };
  }

  return {
    title: `${result.doll.name} | Maille & Merveille`,
    description:
      result.doll.short_intro ||
      result.teaser ||
      "A doll with a story from Maille & Merveille.",
  };
}

export default async function DollPage({ params }) {
  const resolvedParams = await params;
  const result = await getDollData(resolvedParams.slug);

  if (!result) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <div style={cardStyle}>
            <h1 style={{ marginTop: 0 }}>Doll not found</h1>
            <p style={mutedText}>
              This doll page does not exist yet or is not available.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const { doll, teaser, mainStory, miniStories } = result;

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <section style={heroCardStyle}>
          <div style={heroGridStyle}>
            <div>
              <div style={eyebrowStyle}>MAILLE & MERVEILLE</div>
              <h1 style={titleStyle}>{doll.name}</h1>
              <div style={themeBadgeStyle}>{doll.theme_name || "Unassigned"}</div>
              <p style={introStyle}>
                {doll.short_intro || "A one-of-a-kind handmade doll with a story."}
              </p>
            </div>

            <div style={visualPlaceholderStyle}>
              <div style={visualInnerStyle}>
                <div style={visualLabelStyle}>Visual Placeholder</div>
                <div style={visualSubLabelStyle}>
                  Future doll image / illustration / branded scene
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={contentGridStyle}>
          <div style={mainColumnStyle}>
            <article style={sectionCardStyle}>
              <div style={sectionLabelStyle}>Card Teaser</div>
              <p style={bodyTextStyle}>{teaser || "No teaser available yet."}</p>
            </article>

            <article style={sectionCardStyle}>
              <div style={sectionLabelStyle}>Main Story</div>
              <p style={bodyTextStyle}>{mainStory || "No main story available yet."}</p>
            </article>

            <article style={sectionCardStyle}>
              <div style={sectionLabelStyle}>Little Story Moments</div>
              {miniStories.length ? (
                <div style={{ display: "grid", gap: 14 }}>
                  {miniStories.map((story) => (
                    <div key={story.id} style={miniStoryCardStyle}>
                      <p style={{ ...bodyTextStyle, margin: 0 }}>{story.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={bodyTextStyle}>No mini stories available yet.</p>
              )}
            </article>
          </div>

          <aside style={sideColumnStyle}>
            <section style={sideCardStyle}>
              <div style={sectionLabelStyle}>This Doll’s World</div>
              <p style={bodyTextStyle}>
                {doll.name} belongs to the{" "}
                <strong>{doll.theme_name || "Unassigned"}</strong> world.
              </p>
              <p style={mutedText}>
                This block is ready for future universe-building, collection links,
                and cross-sell storytelling.
              </p>
            </section>

            <section style={sideCardStyle}>
              <div style={sectionLabelStyle}>Coming Soon</div>
              <ul style={listStyle}>
                <li>Related dolls</li>
                <li>Activity pages</li>
                <li>New story chapters</li>
                <li>Printable extras</li>
              </ul>
            </section>

            <section style={sideCardStyle}>
              <div style={sectionLabelStyle}>QR Destination Ready</div>
              <p style={mutedText}>
                This page is designed to become the digital destination linked to a
                doll’s printed QR card.
              </p>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

const pageStyle = {
  background: "#f8f7f4",
  minHeight: "100vh",
  padding: "32px 20px 48px",
  color: "#1f2937",
  fontFamily: "Inter, Arial, sans-serif",
};

const containerStyle = {
  maxWidth: "1120px",
  margin: "0 auto",
};

const heroCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "28px",
  padding: "32px",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)",
};

const heroGridStyle = {
  display: "grid",
  gridTemplateColumns: "1.15fr 0.85fr",
  gap: "24px",
  alignItems: "center",
};

const eyebrowStyle = {
  fontSize: "13px",
  letterSpacing: "0.2em",
  color: "#6b7280",
  marginBottom: "12px",
};

const titleStyle = {
  fontSize: "54px",
  lineHeight: 1,
  margin: "0 0 14px",
};

const themeBadgeStyle = {
  display: "inline-block",
  background: "#f3f4f6",
  color: "#374151",
  borderRadius: "999px",
  padding: "8px 14px",
  fontSize: "14px",
  marginBottom: "18px",
};

const introStyle = {
  fontSize: "19px",
  lineHeight: 1.7,
  color: "#4b5563",
  margin: 0,
  maxWidth: "680px",
};

const visualPlaceholderStyle = {
  background: "linear-gradient(135deg, #f5efe6 0%, #f1f5f9 100%)",
  border: "1px dashed #cbd5e1",
  borderRadius: "24px",
  minHeight: "320px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
};

const visualInnerStyle = {
  textAlign: "center",
};

const visualLabelStyle = {
  fontSize: "20px",
  fontWeight: 700,
  marginBottom: "10px",
};

const visualSubLabelStyle = {
  color: "#6b7280",
  fontSize: "15px",
  lineHeight: 1.6,
};

const contentGridStyle = {
  display: "grid",
  gridTemplateColumns: "1.2fr 0.8fr",
  gap: "24px",
  marginTop: "24px",
};

const mainColumnStyle = {
  display: "grid",
  gap: "20px",
};

const sideColumnStyle = {
  display: "grid",
  gap: "20px",
};

const sectionCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "24px",
  padding: "24px",
};

const sideCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "24px",
  padding: "24px",
};

const sectionLabelStyle = {
  fontSize: "14px",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#9ca3af",
  marginBottom: "14px",
};

const bodyTextStyle = {
  fontSize: "18px",
  lineHeight: 1.8,
  color: "#374151",
  margin: 0,
  whiteSpace: "pre-wrap",
};

const miniStoryCardStyle = {
  background: "#fafaf9",
  border: "1px solid #ece7df",
  borderRadius: "18px",
  padding: "18px",
};

const mutedText = {
  color: "#6b7280",
  lineHeight: 1.7,
  fontSize: "16px",
};

const listStyle = {
  margin: 0,
  paddingLeft: "18px",
  color: "#4b5563",
  lineHeight: 1.9,
};

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "24px",
  padding: "28px",
};
