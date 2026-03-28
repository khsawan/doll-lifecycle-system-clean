"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { buildV1Experience } from "../../../lib/publicExperience";
import V1ExperienceShell from "./V1ExperienceShell";

const AMBIENT_PARTICLES = [
  {
    left: "6%",
    top: "78%",
    size: "96px",
    duration: "30s",
    delay: "-4s",
    driftX: "18px",
    driftY: "-180px",
    opacity: "0.2",
    blur: "0.7px",
    radius: "999px",
  },
  {
    left: "19%",
    top: "22%",
    size: "58px",
    duration: "26s",
    delay: "-12s",
    driftX: "-10px",
    driftY: "-126px",
    opacity: "0.17",
    blur: "0.45px",
    radius: "999px",
  },
  {
    left: "32%",
    top: "58%",
    size: "80px",
    duration: "32s",
    delay: "-7s",
    driftX: "16px",
    driftY: "-172px",
    opacity: "0.19",
    blur: "0.6px",
    radius: "999px",
  },
  {
    left: "48%",
    top: "14%",
    size: "108px",
    duration: "36s",
    delay: "-18s",
    driftX: "-14px",
    driftY: "-152px",
    opacity: "0.17",
    blur: "0.85px",
    radius: "999px",
  },
  {
    left: "66%",
    top: "72%",
    size: "70px",
    duration: "28s",
    delay: "-10s",
    driftX: "12px",
    driftY: "-146px",
    opacity: "0.18",
    blur: "0.55px",
    radius: "999px",
  },
  {
    left: "82%",
    top: "36%",
    size: "90px",
    duration: "34s",
    delay: "-15s",
    driftX: "-14px",
    driftY: "-168px",
    opacity: "0.18",
    blur: "0.75px",
    radius: "999px",
  },
  {
    left: "91%",
    top: "84%",
    size: "56px",
    duration: "25s",
    delay: "-21s",
    driftX: "8px",
    driftY: "-132px",
    opacity: "0.16",
    blur: "0.45px",
    radius: "999px",
  },
];

export default function DollPublicPage() {
  const params = useParams();

  const slug = useMemo(() => {
    if (!params?.slug) return "";
    return Array.isArray(params.slug) ? params.slug[0] : params.slug;
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [experience, setExperience] = useState(null);

  useEffect(() => {
    async function loadExperience() {
      if (!slug) {
        return;
      }

      if (!supabase) {
        setError("This doll page is not configured yet.");
        setExperience(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const { data: dollRow, error: dollError } = await supabase
        .from("dolls")
        .select("*")
        .eq("slug", slug)
        .single();

      if (dollError || !dollRow) {
        setError("This doll page could not be found.");
        setExperience(null);
        setLoading(false);
        return;
      }

      const { data: storyRows } = await supabase
        .from("stories")
        .select("*")
        .eq("doll_id", dollRow.id)
        .order("sequence_order", { ascending: true });

      let relatedDollRows = [];

      if (dollRow.universe_id) {
        const { data } = await supabase
          .from("dolls")
          .select("id, slug, name, short_intro, emotional_hook, image_url, theme_name, universe_id")
          .eq("universe_id", dollRow.universe_id)
          .neq("id", dollRow.id)
          .limit(3);

        relatedDollRows = data || [];
      }

      if (!relatedDollRows.length && dollRow.theme_name) {
        const { data } = await supabase
          .from("dolls")
          .select("id, slug, name, short_intro, emotional_hook, image_url, theme_name")
          .eq("theme_name", dollRow.theme_name)
          .neq("id", dollRow.id)
          .limit(3);

        relatedDollRows = data || [];
      }

      const testStoryRows = [
        {
          type: "teaser",
          content: "A gentle moment on the farm with Rosie.",
        },
        {
          type: "main",
          content: `Rosie stepped into the quiet farmyard, where soft morning light touched the wooden fence and little chickens wandered gently through the grass.

She felt a little unsure as a fluffy chick came close to her feet, peeping softly as if waiting for her to say hello.

Rosie knelt down and held out her hand, and the tiny chick hopped closer, followed by two more, gathering around her in a soft, happy circle.

Soon the whole farm felt calm and friendly, and Rosie smiled, feeling brave and at home among her new little friends.`,
        },
        {
          type: "mini",
          content: "Rosie loves quiet mornings on the farm.",
        },
        {
          type: "mini",
          content: "Even the smallest hello can make a new friend.",
        },
      ];

      setExperience(
        buildV1Experience({
          dollRow,
          storyRows: testStoryRows,
          relatedDollRows,
        })
      );
      setLoading(false);
    }

    loadExperience();
  }, [slug]);

  if (loading) {
    return (
      <main style={stateShellStyle}>
        <div style={stateCardStyle}>Loading doll story...</div>
      </main>
    );
  }

  if (error || !experience) {
    return (
      <main style={stateShellStyle}>
        <div style={errorCardStyle}>
          <h1 style={errorTitleStyle}>Doll page unavailable</h1>
          <p style={errorTextStyle}>
            {error || "We could not load this doll page right now."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="publicExperienceWrap" style={publicExperienceWrapStyle}>
      <V1ExperienceShell experience={experience} />
      <AmbientParticleLayer />
    </div>
  );
}

function AmbientParticleLayer() {
  return (
    <>
      <div aria-hidden="true" className="ambientLayer" style={ambientLayerStyle}>
        {AMBIENT_PARTICLES.map((particle, index) => (
          <span
            key={`ambient-particle-${index}`}
            className="ambientParticle"
            style={{
              "--ambient-left": particle.left,
              "--ambient-top": particle.top,
              "--ambient-size": particle.size,
              "--ambient-duration": particle.duration,
              "--ambient-delay": particle.delay,
              "--ambient-drift-x": particle.driftX,
              "--ambient-drift-y": particle.driftY,
              "--ambient-opacity": particle.opacity,
              "--ambient-blur": particle.blur,
              "--ambient-radius": particle.radius,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes ambientParticleFloat {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg) scale(0.9);
            opacity: 0;
          }

          18% {
            opacity: var(--ambient-opacity);
          }

          65% {
            transform: translate3d(
                calc(var(--ambient-drift-x) * 0.58),
                calc(var(--ambient-drift-y) * 0.62),
                0
              )
              rotate(5deg)
              scale(1);
            opacity: calc(var(--ambient-opacity) * 0.92);
          }

          100% {
            transform: translate3d(var(--ambient-drift-x), var(--ambient-drift-y), 0)
              rotate(10deg)
              scale(1.05);
            opacity: 0;
          }
        }

        .ambientParticle {
          position: absolute;
          left: var(--ambient-left);
          top: var(--ambient-top);
          width: var(--ambient-size);
          height: calc(var(--ambient-size) * 1.15);
          border-radius: var(--ambient-radius);
          background:
            radial-gradient(
              circle at 38% 38%,
              rgba(255, 255, 255, 0.54) 0%,
              rgba(255, 250, 244, 0.3) 36%,
              rgba(255, 235, 217, 0.12) 56%,
              rgba(255, 235, 217, 0.03) 72%,
              rgba(255, 235, 217, 0) 82%
            );
          filter: blur(var(--ambient-blur));
          box-shadow: 0 0 24px rgba(255, 244, 232, 0.12);
          opacity: var(--ambient-opacity);
          will-change: transform, opacity;
          animation: ambientParticleFloat var(--ambient-duration) linear infinite;
          animation-delay: var(--ambient-delay);
          transform: translate3d(0, 0, 0);
        }

        @media (max-width: 720px) {
          .ambientParticle {
            width: calc(var(--ambient-size) * 0.82);
            height: calc(var(--ambient-size) * 0.94);
          }
        }
      `}</style>

      <style jsx global>{`
        .publicExperienceWrap section > div {
          position: relative;
          z-index: 2;
        }
      `}</style>
    </>
  );
}

const publicExperienceWrapStyle = {
  position: "relative",
  minHeight: "100svh",
  isolation: "isolate",
  overflow: "hidden",
};

const ambientLayerStyle = {
  position: "fixed",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none",
  zIndex: 1,
};

const stateShellStyle = {
  minHeight: "100svh",
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(180deg, #f8fafc 0%, #fffaf5 100%)",
  padding: 16,
};

const stateCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 28,
  padding: 28,
  color: "#64748b",
  fontSize: 18,
  textAlign: "center",
};

const errorCardStyle = {
  background: "#ffffff",
  border: "1px solid #fecaca",
  borderRadius: 28,
  padding: 28,
  textAlign: "center",
  maxWidth: 480,
};

const errorTitleStyle = {
  margin: "0 0 12px",
  fontSize: 28,
  color: "#0f172a",
};

const errorTextStyle = {
  margin: 0,
  color: "#64748b",
  lineHeight: 1.8,
};
