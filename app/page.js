"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import QRCode from "qrcode";
import { supabase } from "../lib/supabase";

const DEFAULT_THEMES = [
  "Unassigned",
  "Nature Friends",
  "Little Dreamers",
  "Cozy World",
];
const STORY_TONES = ["Gentle", "Playful", "Magical"];
const STATUSES = ["new", "identity", "story", "digital", "content", "sales", "live"];

function slugify(value) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function statusLabel(status) {
  if (!status) return "New";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function progressFromStatus(status) {
  const idx = STATUSES.indexOf(status || "new");
  return idx >= 0 ? Math.round(((idx + 1) / STATUSES.length) * 100) : 0;
}

function cleanList(value) {
  return (value || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function getPublicBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
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

function buildContentPack(doll, storyData, publicBaseUrl) {
  const name = doll.name || "This doll";
  const theme = doll.theme_name || "Unassigned";
  const hook = doll.emotional_hook || `${name} brings warmth and wonder wherever she goes`;
  const intro = doll.short_intro || `${name} is a one-of-a-kind handmade doll with a story.`;
  const teaser = storyData.teaser || `Meet ${name}, a one-of-a-kind doll with a gentle story to tell.`;
  const publicDollUrl = publicBaseUrl ? `${publicBaseUrl}/doll/${slugify(name)}` : "";

  return {
    caption: `${name} ✨

${intro}

${teaser}

Discover ${name}'s world: ${publicDollUrl}

#MailleEtMerveille #DollWithAStory #HandmadeDoll`,
    hook: `Meet ${name}, a one-of-a-kind doll from the ${theme} world.`,
    blurb: `${name} is a handmade doll created to bring story, warmth, and imagination into everyday moments. ${hook}`,
    cta: `Discover ${name}'s world`,
  };
}

function buildReadiness(identity, story, contentPack, order, publicUrl) {
  const checks = {
    identity:
      Boolean(identity.name?.trim()) &&
      Boolean(identity.theme_name?.trim()) &&
      Boolean(identity.personality_traits?.trim()) &&
      Boolean(identity.emotional_hook?.trim()) &&
      Boolean(identity.short_intro?.trim()),
    story:
      Boolean(story.teaser?.trim()) &&
      Boolean(story.mainStory?.trim()) &&
      Boolean(story.mini1?.trim()) &&
      Boolean(story.mini2?.trim()),
    digital: Boolean(publicUrl?.trim()),
    content:
      Boolean(contentPack.caption?.trim()) &&
      Boolean(contentPack.hook?.trim()) &&
      Boolean(contentPack.blurb?.trim()) &&
      Boolean(contentPack.cta?.trim()),
    sales:
      Boolean(order.customer_name?.trim()) &&
      Boolean(order.contact_info?.trim()) &&
      Boolean(order.order_status?.trim()),
  };

  const entries = Object.entries(checks);
  const completed = entries.filter(([, value]) => value).length;
  const score = Math.round((completed / entries.length) * 100);

  return {
    checks,
    score,
    missing: entries.filter(([, value]) => !value).map(([key]) => key),
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
    image_url: "",
  });

  const [storyTone, setStoryTone] = useState("Gentle");
  const [story, setStory] = useState({
    teaser: "",
    mainStory: "",
    mini1: "",
    mini2: "",
  });

  const [contentPack, setContentPack] = useState({
    caption: "",
    hook: "",
    blurb: "",
    cta: "",
  });

  const [order, setOrder] = useState({
    customer_name: "",
    contact_info: "",
    notes: "",
    order_status: "new",
  });

  const [qrDataUrl, setQrDataUrl] = useState("");
  const [qrUploading, setQrUploading] = useState(false);
  const printCardRef = useRef(null);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("identity");

  const selected = useMemo(
    () => dolls.find((d) => d.id === selectedId) || dolls[0] || null,
    [dolls, selectedId]
  );

  const publicBaseUrl = getPublicBaseUrl();
  const selectedSlug = slugify(identity.name || selected?.name || selected?.internal_id || "");
  const publicPath = selectedSlug ? `/doll/${selectedSlug}` : "";
  const publicUrl = selectedSlug && publicBaseUrl ? `${publicBaseUrl}${publicPath}` : "";
  const readiness = buildReadiness(identity, story, contentPack, order, publicUrl);

  const savedQrUrl = selected?.qr_code_url || "";
  const qrStatus = !qrDataUrl
    ? "empty"
    : savedQrUrl && qrDataUrl === savedQrUrl
      ? "saved"
      : "generated";

  async function loadThemes() {
    if (!supabase) return;

    const { data } = await supabase.from("themes").select("name").order("name");
    const dbThemes = (data || []).map((x) => x.name).filter(Boolean);
    const merged = Array.from(new Set(["Unassigned", ...dbThemes, ...DEFAULT_THEMES]));
    setThemes(merged);
  }

  async function loadDolls() {
    if (!supabase) {
      setError("Supabase environment variables are missing.");
      return;
    }

    const { data, error } = await supabase
      .from("dolls")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      setError(error.message);
      return;
    }

    const mapped = (data || []).map((d) => ({
      ...d,
      theme_name: d.theme_name || "Unassigned",
    }));

    setDolls(mapped);

    if (!selectedId && mapped.length) {
      setSelectedId(mapped[0].id);
    }
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
        image_url: doll.image_url || "",
      });

      setQrDataUrl(doll.qr_code_url || "");
    } else {
      setQrDataUrl("");
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

    const { data: contentRows } = await supabase
      .from("content_assets")
      .select("*")
      .eq("doll_id", dollId);

    const caption = (contentRows || []).find((c) => c.type === "instagram_caption")?.content || "";
    const hook = (contentRows || []).find((c) => c.type === "promo_hook")?.content || "";
    const blurb = (contentRows || []).find((c) => c.type === "product_blurb")?.content || "";
    const cta = (contentRows || []).find((c) => c.type === "cta")?.content || "";

    setContentPack({ caption, hook, blurb, cta });

    const { data: orders } = await supabase
      .from("orders")
      .select("*")
      .eq("doll_id", dollId)
      .limit(1);

    if (orders && orders.length > 0) {
      setOrder({
        customer_name: orders[0].customer_name || "",
        contact_info: orders[0].contact_info || "",
        notes: orders[0].notes || "",
        order_status: orders[0].order_status || "new",
      });
    } else {
      setOrder({
        customer_name: "",
        contact_info: "",
        notes: "",
        order_status: "new",
      });
    }
  }

  useEffect(() => {
    loadThemes();
    loadDolls();
  }, []);

  useEffect(() => {
    if (selected) {
      loadDetails(selected.id);
    }
  }, [selectedId, dolls.length]);

  async function createDoll() {
    setError("");
    setNotice("");

    const count = dolls.length + 1;
    const computedName = newDollName || `DOLL-${String(count).padStart(3, "0")}`;

    const payload = {
      internal_id: `DOLL-${String(count).padStart(3, "0")}`,
      name: computedName,
      artist_name: newArtistName || null,
      theme_name: newTheme || "Unassigned",
      status: "new",
      availability_status: "available",
      sales_status: "not_sold",
      slug: slugify(computedName),
    };

    const { data, error } = await supabase
      .from("dolls")
      .insert(payload)
      .select()
      .single();

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
      image_url: identity.image_url,
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
      {
        doll_id: selected.id,
        type: "teaser",
        title: "Card teaser",
        content: story.teaser,
        sequence_order: 1,
      },
      {
        doll_id: selected.id,
        type: "main",
        title: "Main story",
        content: story.mainStory,
        sequence_order: 2,
      },
      {
        doll_id: selected.id,
        type: "mini",
        title: "Mini story 1",
        content: story.mini1,
        sequence_order: 3,
      },
      {
        doll_id: selected.id,
        type: "mini",
        title: "Mini story 2",
        content: story.mini2,
        sequence_order: 4,
      },
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

    setDolls((prev) =>
      prev.map((d) => (d.id === selected.id ? { ...d, status: next } : d))
    );

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

  async function activateDigitalLayer() {
    if (!selected) return;

    const nextSlug = slugify(identity.name || selected.name || selected.internal_id);

    const { error } = await supabase
      .from("dolls")
      .update({ slug: nextSlug, status: "digital" })
      .eq("id", selected.id);

    if (error) {
      setError(error.message);
      return;
    }

    setDolls((prev) =>
      prev.map((d) =>
        d.id === selected.id ? { ...d, slug: nextSlug, status: "digital" } : d
      )
    );

    setNotice("Digital layer activated.");
  }

  async function createQrCodeDataUrl() {
    if (!publicUrl) {
      setError("No public URL available for this doll.");
      return null;
    }

    try {
      return await QRCode.toDataURL(publicUrl, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: "M",
      });
    } catch (err) {
      setError(err?.message || "Failed to generate QR code.");
      return null;
    }
  }

  async function generateQrCode() {
    if (!selected) return;

    setError("");
    setNotice("");

    const dataUrl = await createQrCodeDataUrl();
    if (!dataUrl) {
      return;
    }

    setQrDataUrl(dataUrl);
    setNotice("QR code generated.");
  }

  function downloadQrCode() {
    if (!qrDataUrl || !selected) {
      setError("Generate a QR code first.");
      return;
    }

    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `${selectedSlug || selected.internal_id || "doll"}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotice("QR code downloaded.");
  }

  async function downloadPrintCard() {
    if (!printCardRef.current || !selected) {
      setError("No print card available to download.");
      return;
    }

    setError("");
    setNotice("");

    try {
      const dataUrl = await toPng(printCardRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${selectedSlug || selected.internal_id || "doll"}-print-card.png`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setNotice("Print card downloaded.");
    } catch (err) {
      console.error(err);
      setError("Failed to generate print card download.");
    }
  }

  async function uploadQrToSupabase(qrSource = qrDataUrl) {
    if (!qrSource || !selected) {
      setError("Generate a QR code first.");
      return false;
    }

    setQrUploading(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch(qrSource);
      const blob = await response.blob();

      const filePath = `qr-codes/${selectedSlug || selected.internal_id}.png`;

      const { error: uploadError } = await supabase.storage
        .from("doll-assets")
        .upload(filePath, blob, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from("doll-assets")
        .getPublicUrl(filePath);

      const publicQrUrl = data?.publicUrl || "";

      const { error: updateError } = await supabase
        .from("dolls")
        .update({ qr_code_url: publicQrUrl })
        .eq("id", selected.id);

      if (updateError) {
        throw updateError;
      }

      setDolls((prev) =>
        prev.map((d) =>
          d.id === selected.id ? { ...d, qr_code_url: publicQrUrl } : d
        )
      );

      setQrDataUrl(publicQrUrl);
      setNotice("QR code uploaded and linked to this doll.");
      return true;
    } catch (err) {
      setError(err?.message || "Failed to upload QR code.");
      return false;
    } finally {
      setQrUploading(false);
    }
  }

  async function regenerateSavedQrCode() {
    if (!selected) return;

    setError("");
    setNotice("");

    const dataUrl = await createQrCodeDataUrl();
    if (!dataUrl) {
      return;
    }

    setQrDataUrl(dataUrl);

    const saved = await uploadQrToSupabase(dataUrl);
    if (saved) {
      setNotice("QR code regenerated and linked to this doll.");
    }
  }

  async function uploadImage(file) {
    if (!file || !selected) return;

    setError("");
    setNotice("Uploading image...");

    const filePath = `dolls/${selected.id}-${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("doll-assets")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const { data } = supabase.storage
      .from("doll-assets")
      .getPublicUrl(filePath);

    const publicImageUrl = data?.publicUrl || "";

    const { error: updateError } = await supabase
      .from("dolls")
      .update({ image_url: publicImageUrl })
      .eq("id", selected.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setIdentity((prev) => ({ ...prev, image_url: publicImageUrl }));
    setDolls((prev) =>
      prev.map((d) =>
        d.id === selected.id ? { ...d, image_url: publicImageUrl } : d
      )
    );

    setNotice("Image uploaded.");
  }

  function generateContentPack() {
    if (!selected) return;

    const pack = buildContentPack({ ...selected, ...identity }, story, publicBaseUrl);
    setContentPack(pack);
    setNotice("Content pack generated.");
  }

  async function saveContentPack() {
    if (!selected) return;

    setError("");
    setNotice("");

    await supabase
      .from("content_assets")
      .delete()
      .eq("doll_id", selected.id)
      .in("type", ["instagram_caption", "promo_hook", "product_blurb", "cta"]);

    const inserts = [
      {
        doll_id: selected.id,
        type: "instagram_caption",
        title: "Instagram Caption",
        content: contentPack.caption,
        platform: "instagram",
        status: "draft",
      },
      {
        doll_id: selected.id,
        type: "promo_hook",
        title: "Promo Hook",
        content: contentPack.hook,
        platform: "internal",
        status: "draft",
      },
      {
        doll_id: selected.id,
        type: "product_blurb",
        title: "Product Blurb",
        content: contentPack.blurb,
        platform: "internal",
        status: "draft",
      },
      {
        doll_id: selected.id,
        type: "cta",
        title: "CTA",
        content: contentPack.cta,
        platform: "internal",
        status: "draft",
      },
    ].filter((x) => (x.content || "").trim());

    const { error } = await supabase.from("content_assets").insert(inserts);

    if (error) {
      setError(error.message);
      return;
    }

    const { error: dollError } = await supabase
      .from("dolls")
      .update({ status: "content" })
      .eq("id", selected.id);

    if (dollError) {
      setError(dollError.message);
      return;
    }

    setDolls((prev) =>
      prev.map((d) => (d.id === selected.id ? { ...d, status: "content" } : d))
    );

    setNotice("Content pack saved.");
  }

  async function saveOrder() {
    if (!selected) return;

    setError("");
    setNotice("");

    await supabase.from("orders").delete().eq("doll_id", selected.id);

    const { error } = await supabase.from("orders").insert({
      doll_id: selected.id,
      customer_name: order.customer_name,
      order_status: order.order_status,
    });

    if (error) {
      setError(error.message);
      return;
    }

    await supabase
      .from("dolls")
      .update({
        sales_status: order.order_status === "delivered" ? "sold" : "reserved",
        status: "sales",
      })
      .eq("id", selected.id);

    setDolls((prev) =>
      prev.map((d) =>
        d.id === selected.id
          ? {
              ...d,
              sales_status: order.order_status === "delivered" ? "sold" : "reserved",
              status: "sales",
            }
          : d
      )
    );

    setNotice("Order saved.");
  }

  async function markAsLive() {
    if (!selected) return;

    if (readiness.score < 100) {
      setError(`This doll is not fully ready yet. Missing: ${readiness.missing.join(", ")}`);
      return;
    }

    setError("");
    setNotice("");

    const { error } = await supabase
      .from("dolls")
      .update({ status: "live" })
      .eq("id", selected.id);

    if (error) {
      setError(error.message);
      return;
    }

    setDolls((prev) =>
      prev.map((d) => (d.id === selected.id ? { ...d, status: "live" } : d))
    );

    setNotice("Doll marked as live.");
  }

  async function copyToClipboard(value, successMessage) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(successMessage);
    } catch {
      setError("Clipboard copy failed.");
    }
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
        <div style={{ letterSpacing: 3, fontSize: 14, color: "#64748b", marginBottom: 8 }}>
          MAILLE & MERVEILLE
        </div>

        <h1 style={{ fontSize: 50, margin: 0, lineHeight: 1.05 }}>
          Doll Lifecycle System
        </h1>

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
              <label style={labelStyle}>Doll name or temporary label</label>
              <input value={newDollName} onChange={(e) => setNewDollName(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Artist name</label>
              <input value={newArtistName} onChange={(e) => setNewArtistName(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={labelStyle}>Theme</label>
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
                        <div style={{ color: "#64748b", marginTop: 4 }}>
                          {d.internal_id} · {d.theme_name || "Unassigned"}
                        </div>
                      </div>

                      <div style={{ background: "#eef2ff", color: "#0f172a", borderRadius: 999, padding: "6px 12px", fontSize: 14 }}>
                        {statusLabel(d.status)}
                      </div>
                    </div>

                    <div style={{ marginTop: 14, height: 8, background: "#e2e8f0", borderRadius: 999 }}>
                      <div style={{ width: `${progressFromStatus(d.status)}%`, height: "100%", background: "#0f172a", borderRadius: 999 }} />
                    </div>

                    <div style={{ marginTop: 8, color: "#64748b", fontSize: 14 }}>
                      {progressFromStatus(d.status)}% through lifecycle
                    </div>
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
                    <div style={{ color: "#64748b", marginTop: 6 }}>
                      {selected.internal_id} · {identity.theme_name || "Unassigned"}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 12 }}>
                    <button onClick={generateDraft} style={secondaryButton}>Generate Draft</button>
                    <button onClick={advanceStage} style={primaryButton}>Advance Stage</button>
                  </div>
                </div>

                <div style={{ marginTop: 14, color: "#475569" }}>
                  Lifecycle progress: {progressFromStatus(selected.status)}%
                </div>

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
                ) : activeTab === "story" ? (
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
                ) : activeTab === "digital" ? (
                  <div style={{ marginTop: 24, display: "grid", gap: 20 }}>
                    <div style={digitalCardStyle}>
                      <div style={sectionLabelStyle}>Slug</div>
                      <div style={slugRowStyle}>
                        <code style={slugCodeStyle}>{selectedSlug || "no-slug-yet"}</code>
                        <button onClick={() => copyToClipboard(selectedSlug, "Slug copied.")} style={secondaryButton}>
                          Copy Slug
                        </button>
                      </div>
                    </div>

                    <div style={digitalCardStyle}>
                      <div style={sectionLabelStyle}>Public Page</div>
                      <div style={{ display: "grid", gap: 12 }}>
                        <code style={urlCodeStyle}>{publicPath || "/doll/your-doll-slug"}</code>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                          <button onClick={() => window.open(publicUrl, "_blank")} style={primaryButton} disabled={!publicUrl}>
                            Open Public Page
                          </button>
                          <button onClick={() => copyToClipboard(publicUrl, "Public URL copied.")} style={secondaryButton} disabled={!publicUrl}>
                            Copy URL
                          </button>
                        </div>
                      </div>
                    </div>

                    <div style={digitalGridStyle}>
                      <div style={digitalCardStyle}>
                        <div style={sectionLabelStyle}>QR Destination</div>
                        <p style={mutedTextStyle}>
                          This doll is now ready to point a printed QR code to its live story page.
                        </p>

                        <div style={qrPlaceholderStyle}>
                          {qrDataUrl ? (
                            <img
                              src={qrDataUrl}
                              alt={`QR code for ${selected?.name || "doll"}`}
                              style={{ width: 220, height: 220, objectFit: "contain", borderRadius: 12 }}
                            />
                          ) : (
                            <div>
                              <div style={{ fontWeight: 700, marginBottom: 6 }}>No QR generated yet</div>
                              <div style={{ fontSize: 14, color: "#64748b" }}>
                                Generate a QR code for this doll&apos;s public page.
                              </div>
                            </div>
                          )}
                        </div>

                        <div style={qrStatusBoxStyle(qrStatus)}>
                          <div style={{ fontWeight: 700, marginBottom: 6 }}>
                            {qrStatus === "saved"
                              ? "QR saved successfully"
                              : qrStatus === "generated"
                                ? "QR generated but not saved"
                                : "QR not generated yet"}
                          </div>

                          <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.6 }}>
                            {qrStatus === "saved"
                              ? "This QR is stored in Supabase and linked to this doll."
                              : qrStatus === "generated"
                                ? "This QR exists only in the current session until you click Save QR."
                                : "Generate a QR first to preview it here."}
                          </div>
                        </div>

                        {qrStatus === "saved" && savedQrUrl ? (
                          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                            <code style={urlCodeStyle}>{savedQrUrl}</code>
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                              <button
                                onClick={() => window.open(savedQrUrl, "_blank")}
                                style={secondaryButton}
                              >
                                Open Saved QR
                              </button>
                              <button
                                onClick={() => copyToClipboard(savedQrUrl, "Saved QR URL copied.")}
                                style={secondaryButton}
                              >
                                Copy Saved QR URL
                              </button>
                            </div>
                          </div>
                        ) : null}

                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
                          <button onClick={activateDigitalLayer} style={primaryButton}>
                            Activate Digital Layer
                          </button>

                          {savedQrUrl ? (
                            <button
                              onClick={regenerateSavedQrCode}
                              style={secondaryButton}
                              disabled={!publicUrl || qrUploading}
                            >
                              {qrUploading ? "Regenerating..." : "Regenerate QR"}
                            </button>
                          ) : null}

                          <button
                            onClick={generateQrCode}
                            style={{
                              ...secondaryButton,
                              opacity: qrStatus === "saved" ? 0.65 : 1,
                              cursor: qrStatus === "saved" ? "not-allowed" : "pointer",
                            }}
                            disabled={!publicUrl || qrStatus === "saved"}
                          >
                            Generate QR
                          </button>

                          <button onClick={downloadQrCode} style={secondaryButton} disabled={!qrDataUrl}>
                            Download PNG
                          </button>

                          <button onClick={downloadPrintCard} style={secondaryButton} disabled={!qrDataUrl}>
                            Download Print Card
                          </button>

                          <button
                            onClick={uploadQrToSupabase}
                            style={{
                              ...secondaryButton,
                              opacity: qrStatus === "saved" ? 0.65 : 1,
                              cursor: qrStatus === "saved" ? "not-allowed" : "pointer",
                            }}
                            disabled={!qrDataUrl || qrUploading || qrStatus === "saved"}
                          >
                            {qrUploading ? "Uploading..." : qrStatus === "saved" ? "Saved" : "Save QR"}
                          </button>
                        </div>

                        {qrDataUrl ? (
                          <div style={printCardWrapperStyle}>
                            <div ref={printCardRef} style={printCardStyle}>
                              <div style={printCardNameStyle}>
                                {identity.name || selected?.name || "Doll"}
                              </div>

                              <div style={printCardTextStyle}>
                                Scan to discover her world ✨
                              </div>

                              <img
                                src={qrDataUrl}
                                alt={`Print card QR for ${identity.name || selected?.name || "doll"}`}
                                style={printCardQrStyle}
                              />

                              <div style={printCardBrandStyle}>
                                Maille &amp; Merveille
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div style={digitalCardStyle}>
                        <div style={sectionLabelStyle}>Visual Block</div>
                        <div style={visualPlaceholderStyle}>
                          <div style={{ width: "100%" }}>
                            {identity.image_url ? (
                              <img
                                src={identity.image_url}
                                alt="Doll"
                                style={{
                                  width: "100%",
                                  borderRadius: 16,
                                  objectFit: "cover",
                                  maxHeight: 260,
                                }}
                              />
                            ) : (
                              <div>
                                <div style={{ fontWeight: 700, marginBottom: 6 }}>No image yet</div>
                                <div style={{ fontSize: 14, color: "#64748b" }}>
                                  Upload a doll image
                                </div>
                              </div>
                            )}

                            <input
                              type="file"
                              accept="image/*"
                              style={{ marginTop: 12 }}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                await uploadImage(file);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : activeTab === "content" ? (
                  <div style={{ marginTop: 24, display: "grid", gap: 20 }}>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <button onClick={generateContentPack} style={primaryButton}>Generate Content Pack</button>
                      <button onClick={saveContentPack} style={secondaryButton}>Save Content Pack</button>
                    </div>

                    <div style={contentCardStyle}>
                      <div style={sectionLabelStyle}>Instagram Caption</div>
                      <textarea
                        value={contentPack.caption}
                        onChange={(e) => setContentPack({ ...contentPack, caption: e.target.value })}
                        style={{ ...inputStyle, minHeight: 140 }}
                      />
                    </div>

                    <div style={contentGridStyle}>
                      <div style={contentCardStyle}>
                        <div style={sectionLabelStyle}>Short Promo Hook</div>
                        <textarea
                          value={contentPack.hook}
                          onChange={(e) => setContentPack({ ...contentPack, hook: e.target.value })}
                          style={{ ...inputStyle, minHeight: 120 }}
                        />
                      </div>

                      <div style={contentCardStyle}>
                        <div style={sectionLabelStyle}>CTA</div>
                        <textarea
                          value={contentPack.cta}
                          onChange={(e) => setContentPack({ ...contentPack, cta: e.target.value })}
                          style={{ ...inputStyle, minHeight: 120 }}
                        />
                      </div>
                    </div>

                    <div style={contentCardStyle}>
                      <div style={sectionLabelStyle}>Product Blurb</div>
                      <textarea
                        value={contentPack.blurb}
                        onChange={(e) => setContentPack({ ...contentPack, blurb: e.target.value })}
                        style={{ ...inputStyle, minHeight: 140 }}
                      />
                    </div>
                  </div>
                ) : activeTab === "sales" ? (
                  <div style={{ marginTop: 24, display: "grid", gap: 20 }}>
                    <div style={contentCardStyle}>
                      <div style={sectionLabelStyle}>Customer Name</div>
                      <input
                        value={order.customer_name}
                        onChange={(e) => setOrder({ ...order, customer_name: e.target.value })}
                        style={inputStyle}
                      />
                    </div>

                    <div style={contentCardStyle}>
                      <div style={sectionLabelStyle}>Contact Info</div>
                      <input
                        value={order.contact_info}
                        onChange={(e) => setOrder({ ...order, contact_info: e.target.value })}
                        style={inputStyle}
                      />
                    </div>

                    <div style={contentCardStyle}>
                      <div style={sectionLabelStyle}>Order Status</div>
                      <select
                        value={order.order_status}
                        onChange={(e) => setOrder({ ...order, order_status: e.target.value })}
                        style={inputStyle}
                      >
                        <option value="new">New</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>

                    <div style={contentCardStyle}>
                      <div style={sectionLabelStyle}>Notes</div>
                      <textarea
                        value={order.notes}
                        onChange={(e) => setOrder({ ...order, notes: e.target.value })}
                        style={{ ...inputStyle, minHeight: 120 }}
                      />
                    </div>

                    <button onClick={saveOrder} style={primaryButton}>
                      Save Order
                    </button>
                  </div>
                ) : activeTab === "live" ? (
                  <div style={{ marginTop: 24, display: "grid", gap: 20 }}>
                    <div style={contentCardStyle}>
                      <div style={sectionLabelStyle}>Launch Readiness</div>
                      <div style={{ fontSize: 40, fontWeight: 700, marginBottom: 8 }}>
                        {readiness.score}%
                      </div>
                      <div style={{ color: "#64748b", fontSize: 16 }}>
                        This score reflects whether the doll is ready to be treated as a live release.
                      </div>
                    </div>

                    <div style={contentCardStyle}>
                      <div style={sectionLabelStyle}>Checklist</div>
                      <div style={{ display: "grid", gap: 12 }}>
                        {[
                          ["Identity complete", readiness.checks.identity],
                          ["Story complete", readiness.checks.story],
                          ["Digital page ready", readiness.checks.digital],
                          ["Content pack ready", readiness.checks.content],
                          ["Sales info present", readiness.checks.sales],
                        ].map(([label, done]) => (
                          <div
                            key={label}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "14px 16px",
                              border: "1px solid #e5e7eb",
                              borderRadius: 16,
                              background: done ? "#ecfdf5" : "#fff7ed",
                            }}
                          >
                            <div style={{ fontSize: 16 }}>{label}</div>
                            <div style={{ fontWeight: 700, color: done ? "#166534" : "#9a3412" }}>
                              {done ? "Ready" : "Missing"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={contentCardStyle}>
                      <div style={sectionLabelStyle}>Missing Items</div>
                      {readiness.missing.length ? (
                        <ul style={{ margin: 0, paddingLeft: 18, color: "#64748b", lineHeight: 1.9 }}>
                          {readiness.missing.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <div style={{ color: "#166534", fontWeight: 600 }}>
                          Everything is ready.
                        </div>
                      )}
                    </div>

                    <div style={contentCardStyle}>
                      <div style={sectionLabelStyle}>Release Action</div>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <button onClick={markAsLive} style={primaryButton}>
                          Mark as Live
                        </button>

                        {publicUrl ? (
                          <button onClick={() => window.open(publicUrl, "_blank")} style={secondaryButton}>
                            Open Public Page
                          </button>
                        ) : null}
                      </div>
                    </div>
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

const digitalCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 22,
  padding: 20,
};

const slugRowStyle = {
  display: "flex",
  gap: 12,
  alignItems: "center",
  flexWrap: "wrap",
};

const slugCodeStyle = {
  display: "inline-block",
  background: "#f8fafc",
  border: "1px solid #cbd5e1",
  borderRadius: 14,
  padding: "12px 14px",
  fontSize: 16,
};

const urlCodeStyle = {
  display: "block",
  background: "#f8fafc",
  border: "1px solid #cbd5e1",
  borderRadius: 14,
  padding: "12px 14px",
  fontSize: 15,
  overflowWrap: "anywhere",
};

const digitalGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 20,
};

const qrPlaceholderStyle = {
  margin: "14px 0 18px",
  border: "1px dashed #cbd5e1",
  borderRadius: 18,
  minHeight: 260,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  background: "#f8fafc",
  padding: 20,
};

function qrStatusBoxStyle(status) {
  if (status === "saved") {
    return {
      background: "#ecfdf5",
      border: "1px solid #86efac",
      borderRadius: 16,
      padding: 16,
      marginTop: 4,
    };
  }

  if (status === "generated") {
    return {
      background: "#fff7ed",
      border: "1px solid #fdba74",
      borderRadius: 16,
      padding: 16,
      marginTop: 4,
    };
  }

  return {
    background: "#f8fafc",
    border: "1px solid #cbd5e1",
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
  };
}

const visualPlaceholderStyle = {
  border: "1px dashed #cbd5e1",
  borderRadius: 18,
  minHeight: 220,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  background: "linear-gradient(135deg, #f5efe6 0%, #f1f5f9 100%)",
  padding: 20,
};

const sectionLabelStyle = {
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "#94a3b8",
  marginBottom: 12,
  fontWeight: 700,
};

const mutedTextStyle = {
  color: "#64748b",
  lineHeight: 1.7,
  fontSize: 15,
  margin: 0,
};

const contentCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 22,
  padding: 20,
};

const contentGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 20,
};

const printCardWrapperStyle = {
  marginTop: 18,
  display: "flex",
  justifyContent: "center",
};

const printCardStyle = {
  width: 280,
  background: "#fffaf5",
  border: "1px solid #e5e7eb",
  borderRadius: 24,
  padding: 20,
  textAlign: "center",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
};

const printCardNameStyle = {
  fontSize: 24,
  fontWeight: 700,
  color: "#0f172a",
  marginBottom: 8,
};

const printCardTextStyle = {
  fontSize: 14,
  color: "#64748b",
  lineHeight: 1.6,
  marginBottom: 16,
};

const printCardQrStyle = {
  width: 180,
  height: 180,
  objectFit: "contain",
  borderRadius: 16,
  background: "#ffffff",
  padding: 10,
  border: "1px solid #e5e7eb",
};

const printCardBrandStyle = {
  marginTop: 14,
  fontSize: 12,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#94a3b8",
  fontWeight: 700,
};
