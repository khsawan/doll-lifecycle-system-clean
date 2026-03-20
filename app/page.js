'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabase } from '../lib/supabase';

const supabase = getSupabase();
const STATUSES = ['new', 'identity', 'story', 'digital', 'content', 'sales', 'live', 'archived'];
const TABS = ['identity', 'story', 'digital', 'content', 'sales', 'live'];
const STORY_STYLES = [
  { value: 'gentle', label: 'Gentle' },
  { value: 'playful', label: 'Playful' },
  { value: 'magical', label: 'Magical' },
];

function makeSlug(value) {
  return (value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function stageProgress(status) {
  const idx = STATUSES.indexOf(status);
  return idx >= 0 ? Math.round(((idx + 1) / STATUSES.length) * 100) : 0;
}

function statusLabel(status) {
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'New';
}

function splitTraits(text) {
  return (text || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function firstSentence(text) {
  const cleaned = (text || '').trim();
  if (!cleaned) return '';
  const match = cleaned.match(/[^.!?]+[.!?]?/);
  return match ? match[0].trim() : cleaned;
}

function storyReadiness(doll) {
  let score = 0;
  if (doll?.name?.trim()) score += 25;
  if (doll?.theme_id) score += 15;
  if (doll?.personality_traits?.trim()) score += 25;
  if (doll?.emotional_hook?.trim()) score += 20;
  if (doll?.short_intro?.trim()) score += 15;
  return score;
}

function themedSetting(themeName) {
  const theme = (themeName || '').toLowerCase();
  if (theme.includes('nature')) {
    return 'soft grass, tiny flowers, and little animal friends';
  }
  if (theme.includes('dream')) {
    return 'pastel skies, sleepy stars, and whispering clouds';
  }
  if (theme.includes('cozy')) {
    return 'warm corners, gentle routines, and everyday comfort';
  }
  return 'little moments that feel warm, safe, and full of wonder';
}

function styleWords(style) {
  if (style === 'playful') {
    return {
      tone: 'light, cheerful, and full of movement',
      action: 'turns simple moments into cheerful little games',
      sparkle: 'with a smile that makes every moment feel brighter',
    };
  }
  if (style === 'magical') {
    return {
      tone: 'soft, glowing, and touched by wonder',
      action: 'finds tiny sparkles of magic in ordinary moments',
      sparkle: 'as if a little bit of moonlight follows every step',
    };
  }
  return {
    tone: 'soft, calm, and comforting',
    action: 'makes each day feel gentle and reassuring',
    sparkle: 'with a warmth that makes everyone feel safe',
  };
}

function joinTraits(traits) {
  if (!traits.length) return 'gentle, kind, and curious';
  if (traits.length === 1) return traits[0];
  if (traits.length === 2) return `${traits[0]} and ${traits[1]}`;
  return `${traits[0]}, ${traits[1]}, and ${traits[2]}`;
}

function buildStoryDraft(doll, themeName, style = 'gentle') {
  const name = doll.name?.trim() || 'This doll';
  const theme = themeName || 'Maille & Merveille';
  const traits = splitTraits(doll.personality_traits);
  const traitPhrase = joinTraits(traits);
  const hook = (doll.emotional_hook || '').trim();
  const intro = (doll.short_intro || '').trim();
  const setting = themedSetting(theme);
  const words = styleWords(style);

  const introSentence = intro || `${name} is ${traitPhrase}.`;
  const hookSentence = hook || `${name} ${words.action}.`;
  const compactHook = firstSentence(hookSentence).replace(/[.!?]+$/, '');

  const teaser = `Meet ${name}, a one-of-a-kind friend who ${compactHook.charAt(0).toLowerCase()}${compactHook.slice(1)}.`;

  const main = `${name} lives in a world of ${setting}. ${introSentence} ${hookSentence} In this ${words.tone} little world, ${name} notices the small things others miss and turns them into stories worth keeping ${words.sparkle}.`;

  const mini1 = `${name} once found a quiet little moment and made it feel special just by being ${traits[0] || 'gentle'}.`;
  const mini2 = `Whenever someone feels small or unsure, ${name} remembers that ${traits[1] || traits[0] || 'kindness'} can change the whole day.`;

  const caption = `Meet ${name} 💛 ${compactHook}. A one-of-a-kind doll from our ${theme} world.`;
  const visualPrompt = `${theme} storybook aesthetic, ${style} tone, handmade doll feeling, child-friendly composition, warm premium brand look, soft natural lighting, poetic and polished`; 
  const heroText = introSentence;
  const slug = makeSlug(name || doll.internal_id);

  return { teaser, main, mini1, mini2, caption, visualPrompt, heroText, slug };
}

export default function HomePage() {
  const [themes, setThemes] = useState([{ id: 'unassigned', name: 'Unassigned' }]);
  const [dolls, setDolls] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [tab, setTab] = useState('identity');
  const [newDoll, setNewDoll] = useState({ name: '', artist_name: '', theme_id: 'unassigned' });
  const [storyPack, setStoryPack] = useState({ teaser: '', main: '', mini1: '', mini2: '' });
  const [storyStyle, setStoryStyle] = useState('gentle');
  const [contentPack, setContentPack] = useState({ caption: '', visualPrompt: '' });
  const [digitalPack, setDigitalPack] = useState({ slug: '', hero_text: '', qr_url: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const selected = dolls.find((d) => d.id === selectedId) || null;
  const selectedThemeName = themes.find((t) => t.id === selected?.theme_id)?.name || 'Unassigned';
  const readiness = storyReadiness(selected);

  const metrics = useMemo(() => ({
    total: dolls.length,
    live: dolls.filter((d) => d.status === 'live').length,
    available: dolls.filter((d) => d.availability_status === 'available').length,
    sold: dolls.filter((d) => ['sold', 'in_delivery', 'delivered'].includes(d.sales_status)).length,
  }), [dolls]);

  async function loadBase() {
    setLoading(true);
    setError('');
    try {
      const [{ data: themesData, error: themesError }, { data: dollsData, error: dollsError }] = await Promise.all([
        supabase.from('themes').select('id,name').order('name'),
        supabase.from('dolls').select('*').order('created_at', { ascending: false }),
      ]);
      if (themesError) throw themesError;
      if (dollsError) throw dollsError;
      setThemes([...(themesData || []), { id: 'unassigned', name: 'Unassigned' }]);
      setDolls(dollsData || []);
      setSelectedId((current) => current || dollsData?.[0]?.id || '');
    } catch (e) {
      setError(e.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadBase(); }, []);

  useEffect(() => {
    async function loadDetails() {
      if (!selected) return;
      const [profile, stories, page, content] = await Promise.all([
        supabase.from('character_profiles').select('*').eq('doll_id', selected.id).maybeSingle(),
        supabase.from('stories').select('*').eq('doll_id', selected.id).order('sequence_order'),
        supabase.from('digital_pages').select('*').eq('doll_id', selected.id).maybeSingle(),
        supabase.from('content_assets').select('*').eq('doll_id', selected.id),
      ]);
      setDolls((prev) => prev.map((d) => d.id === selected.id ? {
        ...d,
        personality_traits: profile.data?.personality_traits || '',
        emotional_hook: profile.data?.emotional_hook || '',
        short_intro: profile.data?.short_intro || '',
      } : d));
      const teaser = stories.data?.find((x) => x.type === 'teaser')?.content || '';
      const main = stories.data?.find((x) => x.type === 'main')?.content || '';
      const minis = stories.data?.filter((x) => x.type === 'mini') || [];
      const caption = content.data?.find((x) => x.type === 'instagram_caption')?.content || '';
      const visualPrompt = content.data?.find((x) => x.type === 'visual_prompt')?.content || '';
      setStoryPack({ teaser, main, mini1: minis[0]?.content || '', mini2: minis[1]?.content || '' });
      const slug = page.data?.slug || selected.slug || makeSlug(selected.name || selected.internal_id);
      setDigitalPack({ slug, hero_text: page.data?.hero_text || profile.data?.short_intro || '', qr_url: `/worlds/${slug}` });
      setContentPack({ caption, visualPrompt });
    }
    loadDetails();
  }, [selectedId]);

  async function createDoll() {
    setSaving(true); setError(''); setNotice('');
    try {
      const internal_id = `DOLL-${String(dolls.length + 1).padStart(3, '0')}`;
      const payload = {
        internal_id,
        name: newDoll.name || internal_id,
        slug: makeSlug(newDoll.name || internal_id),
        theme_id: newDoll.theme_id === 'unassigned' ? null : newDoll.theme_id,
        artist_name: newDoll.artist_name || null,
      };
      const { data, error } = await supabase.from('dolls').insert(payload).select('*').single();
      if (error) throw error;
      setDolls((prev) => [data, ...prev]);
      setSelectedId(data.id);
      setNewDoll({ name: '', artist_name: '', theme_id: 'unassigned' });
      setNotice('New doll added to the pipeline.');
    } catch (e) {
      setError(e.message || 'Failed to create doll.');
    } finally { setSaving(false); }
  }

  async function updateDollBase(patch) {
    if (!selected) return;
    setSaving(true); setError('');
    try {
      const { error } = await supabase.from('dolls').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', selected.id);
      if (error) throw error;
      setDolls((prev) => prev.map((d) => d.id === selected.id ? { ...d, ...patch } : d));
    } catch (e) {
      setError(e.message || 'Failed to save changes.');
    } finally { setSaving(false); }
  }

  async function saveIdentity() {
    if (!selected) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const existing = await supabase.from('character_profiles').select('id').eq('doll_id', selected.id).maybeSingle();
      await updateDollBase({
        name: selected.name,
        slug: makeSlug(selected.name || selected.internal_id),
        theme_id: selected.theme_id === 'unassigned' ? null : selected.theme_id,
        status: selected.status === 'new' ? 'identity' : selected.status,
      });
      const payload = { doll_id: selected.id, personality_traits: selected.personality_traits || '', emotional_hook: selected.emotional_hook || '', short_intro: selected.short_intro || '' };
      const result = existing.data?.id
        ? await supabase.from('character_profiles').update(payload).eq('id', existing.data.id)
        : await supabase.from('character_profiles').insert(payload);
      if (result.error) throw result.error;
      setNotice('Identity saved.');
    } catch (e) {
      setError(e.message || 'Failed to save identity.');
    } finally { setSaving(false); }
  }

  async function saveStories() {
    if (!selected) return;
    setSaving(true); setError(''); setNotice('');
    try {
      await supabase.from('stories').delete().eq('doll_id', selected.id);
      const rows = [
        { doll_id: selected.id, type: 'teaser', title: 'Teaser', content: storyPack.teaser, sequence_order: 1 },
        { doll_id: selected.id, type: 'main', title: 'Main story', content: storyPack.main, sequence_order: 2 },
        { doll_id: selected.id, type: 'mini', title: 'Mini story 1', content: storyPack.mini1, sequence_order: 3 },
        { doll_id: selected.id, type: 'mini', title: 'Mini story 2', content: storyPack.mini2, sequence_order: 4 },
      ].filter((row) => row.content?.trim());
      if (rows.length) {
        const { error } = await supabase.from('stories').insert(rows);
        if (error) throw error;
      }
      await updateDollBase({ status: 'story' });
      setNotice('Story engine output saved.');
    } catch (e) {
      setError(e.message || 'Failed to save stories.');
    } finally { setSaving(false); }
  }

  async function saveDigital() {
    if (!selected) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const slug = makeSlug(digitalPack.slug || selected.name || selected.internal_id);
      const existing = await supabase.from('digital_pages').select('id').eq('doll_id', selected.id).maybeSingle();
      const payload = {
        doll_id: selected.id,
        slug,
        meta_title: `${selected.name || selected.internal_id} | Maille & Merveille`,
        meta_description: selected.short_intro || 'A doll with a story.',
        hero_text: digitalPack.hero_text || selected.short_intro || '',
        status: 'draft',
      };
      let pageId = existing.data?.id;
      if (pageId) {
        const { error } = await supabase.from('digital_pages').update(payload).eq('id', pageId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('digital_pages').insert(payload).select('id').single();
        if (error) throw error;
        pageId = data.id;
      }
      const qrExisting = await supabase.from('qr_codes').select('id').eq('doll_id', selected.id).maybeSingle();
      const qrPayload = { doll_id: selected.id, page_id: pageId, qr_url: `/worlds/${slug}`, version: 1, active: true };
      if (qrExisting.data?.id) {
        const { error } = await supabase.from('qr_codes').update(qrPayload).eq('id', qrExisting.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('qr_codes').insert(qrPayload);
        if (error) throw error;
      }
      await updateDollBase({ status: 'digital', slug });
      setNotice('Digital layer saved.');
    } catch (e) {
      setError(e.message || 'Failed to save digital layer.');
    } finally { setSaving(false); }
  }

  async function saveContent() {
    if (!selected) return;
    setSaving(true); setError(''); setNotice('');
    try {
      await supabase.from('content_assets').delete().eq('doll_id', selected.id).in('type', ['instagram_caption', 'visual_prompt']);
      const rows = [
        { doll_id: selected.id, type: 'instagram_caption', content: contentPack.caption, platform: 'instagram', status: 'draft' },
        { doll_id: selected.id, type: 'visual_prompt', content: contentPack.visualPrompt, platform: 'internal', status: 'draft' },
      ].filter((x) => x.content?.trim());
      if (rows.length) {
        const { error } = await supabase.from('content_assets').insert(rows);
        if (error) throw error;
      }
      await updateDollBase({ status: 'content' });
      setNotice('Content assets saved.');
    } catch (e) {
      setError(e.message || 'Failed to save content.');
    } finally { setSaving(false); }
  }

  function runDraft(style = storyStyle) {
    if (!selected) return;
    const draft = buildStoryDraft(selected, selectedThemeName, style);
    setStoryStyle(style);
    setStoryPack({ teaser: draft.teaser, main: draft.main, mini1: draft.mini1, mini2: draft.mini2 });
    setContentPack({ caption: draft.caption, visualPrompt: draft.visualPrompt });
    setDigitalPack((prev) => ({ ...prev, slug: draft.slug, hero_text: draft.heroText, qr_url: `/worlds/${draft.slug}` }));
    setNotice(`Generated ${style} story pack.`);
    setTab('story');
  }

  async function advanceStage() {
    if (!selected) return;
    const idx = STATUSES.indexOf(selected.status || 'new');
    const next = STATUSES[Math.min(idx + 1, STATUSES.length - 1)];
    await updateDollBase({ status: next });
  }

  function Field({ label, value, onChange, textarea = false, rows = 4, placeholder = '' }) {
    return (
      <label style={{ display: 'block' }}>
        <div style={{ fontSize: 14, color: '#46546f', marginBottom: 8 }}>{label}</div>
        {textarea ? (
          <textarea value={value} onChange={onChange} rows={rows} placeholder={placeholder} style={inputStyle(true)} />
        ) : (
          <input value={value} onChange={onChange} placeholder={placeholder} style={inputStyle(false)} />
        )}
      </label>
    );
  }

  return (
    <main style={{ padding: 28, fontFamily: 'Arial, sans-serif', background: '#f6f8fb', minHeight: '100vh', color: '#0b1730' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <div style={{ letterSpacing: 3, fontSize: 12, color: '#5d6985', marginBottom: 8 }}>MAILLE & MERVEILLE</div>
        <h1 style={{ fontSize: 48, margin: 0 }}>Doll Lifecycle System</h1>
        <p style={{ maxWidth: 860, fontSize: 16, color: '#46546f', marginTop: 8 }}>
          A full internal pipeline that transforms every handmade doll into a character, a living digital story asset, and a scalable brand node.
        </p>

        {notice ? <div style={bannerStyle('#e8f8ee', '#4caf72')}>{notice}</div> : null}
        {error ? <div style={bannerStyle('#fdeced', '#df6c78')}>{error}</div> : null}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 24 }}>
          <Metric label="Total Dolls" value={metrics.total} />
          <Metric label="Live Worlds" value={metrics.live} />
          <Metric label="Available" value={metrics.available} />
          <Metric label="Sold" value={metrics.sold} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 22, marginTop: 24 }}>
          <section style={cardStyle()}>
            <h2 style={sectionTitleStyle}>Pipeline Control</h2>
            <Field label="Doll name or temporary label" value={newDoll.name} onChange={(e) => setNewDoll({ ...newDoll, name: e.target.value })} />
            <div style={{ height: 10 }} />
            <Field label="Artist name" value={newDoll.artist_name} onChange={(e) => setNewDoll({ ...newDoll, artist_name: e.target.value })} />
            <div style={{ height: 10 }} />
            <label>
              <div style={{ fontSize: 14, color: '#46546f', marginBottom: 8 }}>Theme</div>
              <select value={newDoll.theme_id} onChange={(e) => setNewDoll({ ...newDoll, theme_id: e.target.value })} style={inputStyle(false)}>
                {themes.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
              </select>
            </label>
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button style={primaryButtonStyle} onClick={createDoll} disabled={saving}>{saving ? 'Saving...' : 'Create Intake Entry'}</button>
              <button style={secondaryButtonStyle} onClick={loadBase}>Refresh</button>
            </div>

            <div style={{ borderTop: '1px solid #d8deea', marginTop: 18, paddingTop: 18 }}>
              <div style={{ fontSize: 14, color: '#5d6985', marginBottom: 10 }}>Dolls</div>
              {loading ? <div>Loading…</div> : dolls.map((doll) => (
                <button key={doll.id} onClick={() => setSelectedId(doll.id)} style={{ ...miniCardStyle, borderColor: selectedId === doll.id ? '#0b1730' : '#bfc8d9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 18 }}>{doll.name || doll.internal_id}</div>
                      <div style={{ fontSize: 13, color: '#71809d', marginTop: 4 }}>{doll.internal_id} · {themes.find((t) => t.id === doll.theme_id)?.name || 'Unassigned'}</div>
                    </div>
                    <div style={statusPillStyle}>{statusLabel(doll.status)}</div>
                  </div>
                  <div style={progressTrackStyle}><div style={{ ...progressFillStyle, width: `${stageProgress(doll.status)}%` }} /></div>
                  <div style={{ fontSize: 13, color: '#71809d' }}>{stageProgress(doll.status)}% through lifecycle</div>
                </button>
              ))}
            </div>
          </section>

          <section style={cardStyle()}>
            {selected ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ ...sectionTitleStyle, marginBottom: 4 }}>{selected.name || selected.internal_id}</h2>
                    <div style={{ color: '#71809d' }}>{selected.internal_id} · {selectedThemeName}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button style={secondaryButtonStyle} onClick={() => runDraft(storyStyle)}>Generate Draft</button>
                    <button style={primaryButtonStyle} onClick={advanceStage}>Advance Stage</button>
                  </div>
                </div>

                <div style={{ marginTop: 16, color: '#5d6985', fontSize: 14 }}>Lifecycle progress: {stageProgress(selected.status)}%</div>
                <div style={{ ...progressTrackStyle, marginTop: 8, marginBottom: 18 }}><div style={{ ...progressFillStyle, width: `${stageProgress(selected.status)}%` }} /></div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
                  {TABS.map((name) => (
                    <button key={name} onClick={() => setTab(name)} style={tab === name ? activeTabStyle : tabStyle}>{name.charAt(0).toUpperCase() + name.slice(1)}</button>
                  ))}
                </div>

                {tab === 'identity' && (
                  <>
                    <div style={infoCardStyle}>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>Story readiness</div>
                      <div style={{ color: '#46546f', fontSize: 14, marginBottom: 8 }}>The stronger the identity fields, the better the generated stories.</div>
                      <div style={{ color: '#0b1730', fontWeight: 700 }}>{readiness}% ready</div>
                    </div>
                    <div style={{ height: 14 }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <Field label="Name" value={selected.name || ''} onChange={(e) => setDolls((prev) => prev.map((d) => d.id === selected.id ? { ...d, name: e.target.value } : d))} />
                      <label>
                        <div style={{ fontSize: 14, color: '#46546f', marginBottom: 8 }}>Theme</div>
                        <select value={selected.theme_id || 'unassigned'} onChange={(e) => setDolls((prev) => prev.map((d) => d.id === selected.id ? { ...d, theme_id: e.target.value === 'unassigned' ? null : e.target.value } : d))} style={inputStyle(false)}>
                          {themes.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
                        </select>
                      </label>
                      <Field label="Personality traits" value={selected.personality_traits || ''} onChange={(e) => setDolls((prev) => prev.map((d) => d.id === selected.id ? { ...d, personality_traits: e.target.value } : d))} placeholder="gentle, curious, caring" />
                      <Field label="Emotional hook" value={selected.emotional_hook || ''} onChange={(e) => setDolls((prev) => prev.map((d) => d.id === selected.id ? { ...d, emotional_hook: e.target.value } : d))} placeholder="What makes this doll emotionally special?" />
                    </div>
                    <div style={{ height: 14 }} />
                    <Field label="Short intro" value={selected.short_intro || ''} onChange={(e) => setDolls((prev) => prev.map((d) => d.id === selected.id ? { ...d, short_intro: e.target.value } : d))} textarea rows={5} placeholder="A short introduction that sounds like the doll." />
                    <div style={{ marginTop: 18 }}>
                      <button style={primaryButtonStyle} onClick={saveIdentity}>Save Identity</button>
                    </div>
                  </>
                )}

                {tab === 'story' && (
                  <>
                    <div style={infoCardStyle}>
                      <div style={{ fontWeight: 700, marginBottom: 8 }}>Story Engine v2</div>
                      <div style={{ color: '#46546f', fontSize: 14, marginBottom: 12 }}>Choose a tone, then generate a full story pack using the identity details you saved.</div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <select value={storyStyle} onChange={(e) => setStoryStyle(e.target.value)} style={{ ...inputStyle(false), width: 180 }}>
                          {STORY_STYLES.map((style) => <option key={style.value} value={style.value}>{style.label}</option>)}
                        </select>
                        <button style={primaryButtonStyle} onClick={() => runDraft(storyStyle)}>Generate Story Pack</button>
                        {STORY_STYLES.map((style) => (
                          <button key={style.value} style={style.value === storyStyle ? activeChipStyle : chipStyle} onClick={() => runDraft(style.value)}>
                            {style.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ height: 14 }} />
                    <Field label="Card teaser" value={storyPack.teaser} onChange={(e) => setStoryPack({ ...storyPack, teaser: e.target.value })} textarea rows={4} />
                    <div style={{ height: 14 }} />
                    <Field label="Main story" value={storyPack.main} onChange={(e) => setStoryPack({ ...storyPack, main: e.target.value })} textarea rows={5} />
                    <div style={{ height: 14 }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      <Field label="Mini story 1" value={storyPack.mini1} onChange={(e) => setStoryPack({ ...storyPack, mini1: e.target.value })} textarea rows={4} />
                      <Field label="Mini story 2" value={storyPack.mini2} onChange={(e) => setStoryPack({ ...storyPack, mini2: e.target.value })} textarea rows={4} />
                    </div>
                    <div style={{ marginTop: 18 }}>
                      <button style={primaryButtonStyle} onClick={saveStories}>Save Story</button>
                    </div>
                  </>
                )}

                {tab === 'digital' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
                      <Field label="Slug" value={digitalPack.slug} onChange={(e) => setDigitalPack({ ...digitalPack, slug: e.target.value })} />
                      <Field label="Hero text" value={digitalPack.hero_text} onChange={(e) => setDigitalPack({ ...digitalPack, hero_text: e.target.value })} textarea rows={4} />
                      <div style={infoCardStyle}>QR destination preview: {digitalPack.qr_url || 'No URL yet'}</div>
                    </div>
                    <div style={{ marginTop: 18 }}><button style={primaryButtonStyle} onClick={saveDigital}>Save Digital</button></div>
                  </>
                )}

                {tab === 'content' && (
                  <>
                    <Field label="Instagram caption" value={contentPack.caption} onChange={(e) => setContentPack({ ...contentPack, caption: e.target.value })} textarea rows={4} />
                    <div style={{ height: 14 }} />
                    <Field label="Visual prompt" value={contentPack.visualPrompt} onChange={(e) => setContentPack({ ...contentPack, visualPrompt: e.target.value })} textarea rows={4} />
                    <div style={{ marginTop: 18 }}><button style={primaryButtonStyle} onClick={saveContent}>Save Content</button></div>
                  </>
                )}

                {tab === 'sales' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <label>
                      <div style={{ fontSize: 14, color: '#46546f', marginBottom: 8 }}>Availability</div>
                      <select value={selected.availability_status || 'available'} onChange={(e) => updateDollBase({ availability_status: e.target.value })} style={inputStyle(false)}>
                        <option value="available">Available</option>
                        <option value="reserved">Reserved</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </label>
                    <label>
                      <div style={{ fontSize: 14, color: '#46546f', marginBottom: 8 }}>Sales status</div>
                      <select value={selected.sales_status || 'not_sold'} onChange={(e) => updateDollBase({ sales_status: e.target.value })} style={inputStyle(false)}>
                        <option value="not_sold">Not sold</option>
                        <option value="sold">Sold</option>
                        <option value="in_delivery">In delivery</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </label>
                  </div>
                )}

                {tab === 'live' && (
                  <div style={infoCardStyle}>This section will evolve into the living universe layer: seasonal stories, related dolls, activity drops, and cross-sell pathways.</div>
                )}
              </>
            ) : <div>Select a doll to begin.</div>}
          </section>
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value }) {
  return (
    <div style={metricCardStyle}>
      <div style={{ color: '#5d6985', fontSize: 14 }}>{label}</div>
      <div style={{ fontSize: 42, fontWeight: 700, marginTop: 6 }}>{value}</div>
    </div>
  );
}

function cardStyle() {
  return {
    background: '#ffffff',
    border: '1px solid #d8deea',
    borderRadius: 24,
    padding: 22,
    boxSizing: 'border-box',
  };
}

const metricCardStyle = {
  background: '#ffffff',
  border: '1px solid #d8deea',
  borderRadius: 24,
  padding: 22,
};

const miniCardStyle = {
  width: '100%',
  background: '#f8fafc',
  border: '1px solid #bfc8d9',
  borderRadius: 20,
  padding: 14,
  textAlign: 'left',
  cursor: 'pointer',
  marginBottom: 10,
};

const primaryButtonStyle = {
  background: '#0b1730',
  color: '#fff',
  border: 'none',
  borderRadius: 16,
  padding: '12px 16px',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
};

const secondaryButtonStyle = {
  background: '#eef2f8',
  color: '#0b1730',
  border: '1px solid #d8deea',
  borderRadius: 16,
  padding: '12px 16px',
  fontSize: 14,
  cursor: 'pointer',
};

const sectionTitleStyle = {
  fontSize: 22,
  fontWeight: 700,
  margin: 0,
  marginBottom: 16,
};

const tabStyle = {
  background: '#fff',
  border: '1px solid #bfc8d9',
  borderRadius: 14,
  padding: '10px 14px',
  cursor: 'pointer',
  textTransform: 'capitalize',
};

const activeTabStyle = {
  ...tabStyle,
  background: '#0b1730',
  color: '#fff',
  borderColor: '#0b1730',
};

const chipStyle = {
  background: '#fff',
  color: '#0b1730',
  border: '1px solid #bfc8d9',
  borderRadius: 999,
  padding: '10px 14px',
  cursor: 'pointer',
  fontSize: 13,
};

const activeChipStyle = {
  ...chipStyle,
  background: '#eaf0ff',
  borderColor: '#6075ff',
};

const statusPillStyle = {
  background: '#eef2f8',
  color: '#0b1730',
  borderRadius: 999,
  padding: '8px 12px',
  fontSize: 12,
};

const progressTrackStyle = {
  height: 8,
  background: '#d8deea',
  borderRadius: 999,
  overflow: 'hidden',
  margin: '10px 0 8px',
};

const progressFillStyle = {
  height: '100%',
  background: '#0b1730',
  borderRadius: 999,
};

const infoCardStyle = {
  background: '#f8fafc',
  border: '1px solid #d8deea',
  borderRadius: 18,
  padding: 16,
};

function inputStyle(textarea) {
  return {
    width: '100%',
    borderRadius: 16,
    border: '1px solid #bfc8d9',
    padding: '12px 14px',
    fontSize: 16,
    boxSizing: 'border-box',
    outline: 'none',
    resize: textarea ? 'vertical' : 'none',
    background: '#fff',
  };
}

function bannerStyle(bg, border) {
  return {
    marginTop: 20,
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: 18,
    padding: 14,
    color: '#0b1730',
  };
}
