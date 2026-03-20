'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabase } from '../lib/supabase';

const supabase = getSupabase();
const STATUSES = ['new', 'identity', 'story', 'digital', 'content', 'sales', 'live', 'archived'];
const TABS = ['identity', 'story', 'digital', 'content', 'sales', 'live'];

function makeSlug(value) {
  return (value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabase } from '../lib/supabase';

const supabase = getSupabase();
const STATUSES = ['new', 'identity', 'story', 'digital', 'content', 'sales', 'live', 'archived'];
const TABS = ['identity', 'story', 'digital', 'content', 'sales', 'live'];
const STORY_STYLES = ['gentle', 'playful', 'magical'];

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

function themeFlavor(themeName) {
  const theme = (themeName || '').toLowerCase();
  if (theme.includes('nature')) return 'soft farm paths, flowers, grass, and tiny animal friends';
  if (theme.includes('dream')) return 'pastel skies, sleepy stars, and little wonders';
  if (theme.includes('cozy')) return 'warm rooms, quiet corners, and everyday comfort';
  return 'a gentle little world full of warmth and discovery';
}

function styleFlavor(style) {
  if (style === 'magical') return 'with a magical sparkle in every little detail';
  if (style === 'playful') return 'with a playful bounce and cheerful energy';
  return 'with a calm, gentle warmth';
}

function splitTraits(text) {
  return (text || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function buildStoryDraft(doll, themeName, style = 'gentle') {
  const name = doll.name || 'This doll';
  const theme = themeName || 'Unassigned';
  const traits = splitTraits(doll.personality_traits);
  const traitPhrase = traits.length ? traits.slice(0, 3).join(', ') : 'gentle, kind, and curious';
  const hook = doll.emotional_hook || `${name} brings comfort and wonder wherever she goes`;
  const intro = doll.short_intro || `${name} belongs to the ${theme} world and is known for being ${traitPhrase}.`;
  const setting = themeFlavor(theme);
  const tone = styleFlavor(style);

  const teaser = `Meet ${name}, the little friend from ${theme} who ${hook.charAt(0).toLowerCase()}${hook.slice(1)}.`;

  const main = `${name} lives in a world of ${setting}. ${intro} Each day begins with a tiny mission: to notice who needs care, courage, or a smile. ${tone} ${name} turns ordinary moments into little stories that feel safe, warm, and memorable.`;

  const mini1 = `${name} once found the quietest little corner in ${theme.toLowerCase()} and made it feel welcoming just by staying kind and present.`;
  const mini2 = `Whenever someone feels unsure, ${name} remembers that being ${traitPhrase.split(',')[0] || 'gentle'} can change the whole day.`;

  const caption = `Meet ${name} 💛 A one-of-a-kind doll from our ${theme} world. ${hook}`;
  const visualPrompt = `${theme} aesthetic, ${style} storybook mood, handmade doll feeling, child-friendly composition, warm premium brand look, soft natural lighting`;
  const heroText = intro;
  const slug = makeSlug(name || doll.internal_id);

  return { teaser, main, mini1, mini2, caption, visualPrompt, heroText, slug };
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
      const qrResult = qrExisting.data?.id
        ? await supabase.from('qr_codes').update(qrPayload).eq('id', qrExisting.data.id)
        : await supabase.from('qr_codes').insert(qrPayload);
      if (qrResult.error) throw qrResult.error;
      await updateDollBase({ slug, status: 'digital' });
      setDigitalPack((prev) => ({ ...prev, slug, qr_url: `/worlds/${slug}` }));
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
      ].filter((row) => row.content?.trim());
      if (rows.length) {
        const { error } = await supabase.from('content_assets').insert(rows);
        if (error) throw error;
      }
      await updateDollBase({ status: 'content' });
      setNotice('Content saved.');
    } catch (e) {
      setError(e.message || 'Failed to save content.');
    } finally { setSaving(false); }
  }

  function applyDraft(style) {
    if (!selected) return;
    const draft = buildStoryDraft(selected, selectedThemeName, style);
    setStoryStyle(style);
    setStoryPack({ teaser: draft.teaser, main: draft.main, mini1: draft.mini1, mini2: draft.mini2 });
    setContentPack({ caption: draft.caption, visualPrompt: draft.visualPrompt });
    setDigitalPack({ slug: draft.slug, hero_text: draft.heroText, qr_url: `/worlds/${draft.slug}` });
    setNotice(`${statusLabel(style)} story draft generated. Review and save each section to keep it.`);
  }

  function generateAllDrafts() {
    if (!selected) return;
    if (readiness < 60) {
      setError('Complete more of the identity first. Add personality traits, an emotional hook, and a short intro before generating stories.');
      return;
    }
    setError('');
    applyDraft(storyStyle);
  }

  return (
    <main className="container">
      <div className="header">
        <div className="eyebrow">Maille & Merveille</div>
        <h1 className="title">Doll Lifecycle System</h1>
        <div className="subtitle">A full internal pipeline that transforms every handmade doll into a character, a living digital story asset, and a scalable brand node.</div>
      </div>

      {error && <div className="error">{error}</div>}
      {notice && <div className="notice">{notice}</div>}

      <div className="metrics">
        <div className="metric"><div className="metric-label">Total Dolls</div><div className="metric-value">{metrics.total}</div></div>
        <div className="metric"><div className="metric-label">Live Worlds</div><div className="metric-value">{metrics.live}</div></div>
        <div className="metric"><div className="metric-label">Available</div><div className="metric-value">{metrics.available}</div></div>
        <div className="metric"><div className="metric-label">Sold</div><div className="metric-value">{metrics.sold}</div></div>
      </div>

      <div className="layout">
        <section className="panel">
          <h2>Pipeline Control</h2>
          <div className="field"><label>Doll name or temporary label</label><input className="input" value={newDoll.name} onChange={(e) => setNewDoll((p) => ({ ...p, name: e.target.value }))} /></div>
          <div className="field"><label>Artist name</label><input className="input" value={newDoll.artist_name} onChange={(e) => setNewDoll((p) => ({ ...p, artist_name: e.target.value }))} /></div>
          <div className="field"><label>Theme</label><select className="select" value={newDoll.theme_id} onChange={(e) => setNewDoll((p) => ({ ...p, theme_id: e.target.value }))}>{themes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          <div className="button-row"><button className="btn" disabled={saving} onClick={createDoll}>Create Intake Entry</button><button className="btn secondary" onClick={loadBase}>Refresh</button></div>
          <hr style={{ margin: '20px 0', border: 0, borderTop: '1px solid #e2e8f0' }} />
          <div className="small" style={{ marginBottom: 10 }}>Dolls</div>
          <div className="list">
            {loading ? <div className="small">Loading dolls…</div> : dolls.length === 0 ? <div className="small">No dolls yet. Add your first one.</div> : dolls.map((d) => (
              <div key={d.id} className={`card ${selectedId === d.id ? 'active' : ''}`} onClick={() => setSelectedId(d.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div className="card-title">{d.name || d.internal_id}</div>
                    <div className="card-meta">{d.internal_id} · {themes.find((t) => t.id === d.theme_id)?.name || 'Unassigned'}</div>
                  </div>
                  <span className="badge">{statusLabel(d.status)}</span>
                </div>
                <div className="progress"><div style={{ width: `${stageProgress(d.status)}%` }} /></div>
                <div className="card-meta">{stageProgress(d.status)}% through lifecycle</div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          {!selected ? <div className="small">Select a doll to continue.</div> : (
            <>
              <div className="section-top">
                <div>
                  <h2 style={{ marginBottom: 6 }}>{selected.name || selected.internal_id}</h2>
                  <div className="small">{selected.internal_id} · {selectedThemeName}</div>
                </div>
                <div className="button-row">
                  <button className="btn secondary" onClick={generateAllDrafts}>Generate Draft</button>
                  <button className="btn" onClick={() => updateDollBase({ status: STATUSES[Math.min(STATUSES.indexOf(selected.status) + 1, STATUSES.length - 1)] })}>Advance Stage</button>
                </div>
              </div>

              <div className="progress" style={{ marginTop: 16 }}><div style={{ width: `${stageProgress(selected.status)}%` }} /></div>
              <div className="small">Lifecycle progress: {stageProgress(selected.status)}%</div>

              <div className="tabs">
                {TABS.map((name) => <button key={name} className={`tab ${tab === name ? 'active' : ''}`} onClick={() => setTab(name)}>{statusLabel(name)}</button>)}
              </div>

              {tab === 'identity' && (
                <>
                  <div className="grid2">
                    <div className="field"><label>Name</label><input className="input" value={selected.name || ''} onChange={(e) => setDolls((prev) => prev.map((d) => d.id === selected.id ? { ...d, name: e.target.value } : d))} /></div>
                    <div className="field"><label>Theme</label><select className="select" value={selected.theme_id || 'unassigned'} onChange={(e) => setDolls((prev) => prev.map((d) => d.id === selected.id ? { ...d, theme_id: e.target.value === 'unassigned' ? null : e.target.value } : d))}>{themes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                    <div className="field"><label>Personality traits</label><input className="input" value={selected.personality_traits || ''} onChange={(e) => setDolls((prev) => prev.map((d) => d.id === selected.id ? { ...d, personality_traits: e.target.value } : d))} /></div>
                    <div className="field"><label>Emotional hook</label><input className="input" value={selected.emotional_hook || ''} onChange={(e) => setDolls((prev) => prev.map((d) => d.id === selected.id ? { ...d, emotional_hook: e.target.value } : d))} /></div>
                  </div>
                  <div className="field"><label>Short intro</label><textarea className="textarea" value={selected.short_intro || ''} onChange={(e) => setDolls((prev) => prev.map((d) => d.id === selected.id ? { ...d, short_intro: e.target.value } : d))} /></div>
                  <div className="placeholder" style={{ marginBottom: 14 }}>
                    <strong>Story readiness:</strong> {readiness}%<br />
                    Add a theme, personality, emotional hook, and short intro to unlock stronger story generation.
                  </div>
                  <button className="btn" disabled={saving} onClick={saveIdentity}>Save Identity</button>
                </>
              )}

              {tab === 'story' && (
                <>
                  <div className="placeholder" style={{ marginBottom: 16 }}>
                    <strong>Story Engine</strong><br />
                    Choose a tone, generate a story pack from the identity, then refine and save it.
                  </div>
                  <div className="grid2" style={{ marginBottom: 14 }}>
                    <div className="field">
                      <label>Story style</label>
                      <select className="select" value={storyStyle} onChange={(e) => setStoryStyle(e.target.value)}>
                        {STORY_STYLES.map((style) => <option key={style} value={style}>{statusLabel(style)}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label>Quick actions</label>
                      <div className="button-row">
                        <button className="btn secondary" onClick={() => applyDraft('gentle')}>Gentle Draft</button>
                        <button className="btn secondary" onClick={() => applyDraft('playful')}>Playful Draft</button>
                        <button className="btn secondary" onClick={() => applyDraft('magical')}>Magical Draft</button>
                      </div>
                    </div>
                  </div>
                  <div className="field"><label>Card teaser</label><textarea className="textarea" value={storyPack.teaser} onChange={(e) => setStoryPack((p) => ({ ...p, teaser: e.target.value }))} /></div>
                  <div className="field"><label>Main story</label><textarea className="textarea" value={storyPack.main} onChange={(e) => setStoryPack((p) => ({ ...p, main: e.target.value }))} /></div>
                  <div className="grid2">
                    <div className="field"><label>Mini story 1</label><textarea className="textarea" value={storyPack.mini1} onChange={(e) => setStoryPack((p) => ({ ...p, mini1: e.target.value }))} /></div>
                    <div className="field"><label>Mini story 2</label><textarea className="textarea" value={storyPack.mini2} onChange={(e) => setStoryPack((p) => ({ ...p, mini2: e.target.value }))} /></div>
                  </div>
                  <div className="button-row">
                    <button className="btn secondary" onClick={generateAllDrafts}>Generate Story Pack</button>
                    <button className="btn" disabled={saving} onClick={saveStories}>Save Story</button>
                  </div>
                </>
              )}

              {tab === 'digital' && (
                <>
                  <div className="field"><label>Page slug</label><input className="input" value={digitalPack.slug} onChange={(e) => setDigitalPack((p) => ({ ...p, slug: e.target.value }))} /></div>
                  <div className="field"><label>Hero text</label><textarea className="textarea" value={digitalPack.hero_text} onChange={(e) => setDigitalPack((p) => ({ ...p, hero_text: e.target.value }))} /></div>
                  <div className="placeholder">QR destination preview: {digitalPack.qr_url || 'No URL assigned yet'}</div>
                  <button className="btn" disabled={saving} onClick={saveDigital}>Save Digital Layer</button>
                </>
              )}

              {tab === 'content' && (
                <>
                  <div className="field"><label>Instagram caption</label><textarea className="textarea" value={contentPack.caption} onChange={(e) => setContentPack((p) => ({ ...p, caption: e.target.value }))} /></div>
                  <div className="field"><label>Visual prompt</label><textarea className="textarea" value={contentPack.visualPrompt} onChange={(e) => setContentPack((p) => ({ ...p, visualPrompt: e.target.value }))} /></div>
                  <button className="btn" disabled={saving} onClick={saveContent}>Save Content</button>
                </>
              )}

              {tab === 'sales' && (
                <div className="grid2">
                  <div className="field"><label>Availability</label><select className="select" value={selected.availability_status || 'available'} onChange={(e) => updateDollBase({ availability_status: e.target.value })}><option value="available">Available</option><option value="reserved">Reserved</option><option value="unavailable">Unavailable</option></select></div>
                  <div className="field"><label>Sales status</label><select className="select" value={selected.sales_status || 'not_sold'} onChange={(e) => updateDollBase({ sales_status: e.target.value })}><option value="not_sold">Not sold</option><option value="sold">Sold</option><option value="in_delivery">In delivery</option><option value="delivered">Delivered</option></select></div>
                </div>
              )}

              {tab === 'live' && <div className="placeholder">This section is reserved for the living universe manager: seasonal stories, activities, related dolls, and post-sale growth.</div>}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

}

function stageProgress(status) {
  const idx = STATUSES.indexOf(status);
  return idx >= 0 ? Math.round(((idx + 1) / STATUSES.length) * 100) : 0;
}

function statusLabel(status) {
  return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'New';
}

function autoGenerateDraft(doll, themeName) {
  const name = doll.name || 'This doll';
  const theme = themeName || 'Unassigned';
  const personality = doll.personality_traits || 'gentle, magical, kind';
  const hook = doll.emotional_hook || 'brings warmth and wonder everywhere';
  const intro = doll.short_intro || `${name} belongs to the ${theme} world and is known for being ${personality}.`;
  return {
    teaser: `Meet ${name}, a one-of-a-kind friend who ${hook.toLowerCase()}.`,
    main: `${name} belongs to the ${theme} world. ${intro} Every day, ${name} discovers a new little adventure and leaves a little more kindness behind.`,
    mini1: `${name} once turned an ordinary afternoon into a tiny celebration.`,
    mini2: `${name} always notices the small things others forget.`,
    caption: `Meet ${name} 💛 A one-of-a-kind doll from our ${theme} world. ${hook}`,
    visualPrompt: `${theme} aesthetic, handmade doll storybook mood, warm lighting, child-friendly composition, premium brand look`,
    slug: makeSlug(name || doll.internal_id),
  };
}

export default function HomePage() {
  const [themes, setThemes] = useState([{ id: 'unassigned', name: 'Unassigned' }]);
  const [dolls, setDolls] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [tab, setTab] = useState('identity');
  const [newDoll, setNewDoll] = useState({ name: '', artist_name: '', theme_id: 'unassigned' });
  const [storyPack, setStoryPack] = useState({ teaser: '', main: '', mini1: '', mini2: '' });
  const [contentPack, setContentPack] = useState({ caption: '', visualPrompt: '' });
  const [digitalPack, setDigitalPack] = useState({ slug: '', hero_text: '', qr_url: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const selected = dolls.find((d) => d.id === selectedId) || null;
  const selectedThemeName = themes.find((t) => t.id === selected?.theme_id)?.name || 'Unassigned';

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
      setNotice('Stories saved.');
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
      const qrResult = qrExisting.data?.id
        ? await supabase.from('qr_codes').update(qrPayload).eq('id', qrExisting.data.id)
        : await supabase.from('qr_codes').insert(qrPayload);
      if (qrResult.error) throw qrResult.error;
      await updateDollBase({ slug, status: 'digital' });
      setDigitalPack((prev) => ({ ...prev, slug, qr_url: `/worlds/${slug}` }));
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
      ].filter((row) => row.content?.trim());
      if (rows.length) {
        const { error } = await supabase.from('content_assets').insert(rows);
        if (error) throw error;
      }
      await updateDollBase({ status: 'content' });
      setNotice('Content saved.');
    } catch (e) {
      setError(e.message || 'Failed to save content.');
    } finally { setSaving(false); }
  }

  function generateDraft() {
    if (!selected) return;
    const draft = autoGenerateDraft(selected, selectedThemeName);
    setStoryPack({ teaser: draft.teaser, main: draft.main, mini1: draft.mini1, mini2: draft.mini2 });
    setContentPack({ caption: draft.caption, visualPrompt: draft.visualPrompt });
    setDigitalPack({ slug: draft.slug, hero_text: selected.short_intro || '', qr_url: `/worlds/${draft.slug}` });
    setNotice('Draft content generated. Save each section to keep it.');
  }

  return (
    <main className="container">
      <div className="header">
        <div className="eyebrow">Maille & Merveille</div>
        <h1 className="title">Doll Lifecycle System</h1>
        <div className="subtitle">A full internal pipeline that transforms every handmade doll into a character, a living digital story asset, and a scalable brand node.</div>
      </div>

      {error && <div className="error">{error}</div>}
      {notice && <div className="notice">{notice}</div>}

      <div className="metrics">
        <div className="metric"><div className="metric-label">Total Dolls</div><div className="metric-value">{metrics.total}</div></div>
        <div className="metric"><div className="metric-label">Live Worlds</div><div className="metric-value">{metrics.live}</div></div>
        <div className="metric"><div className="metric-label">Available</div><div className="metric-value">{metrics.available}</div></div>
        <div className="metric"><div className="metric-label">Sold</div><div className="metric-value">{metrics.sold}</div></div>
      </div>

      <div className="layout">
        <section className="panel">
          <h2>Pipeline Control</h2>
          <div className="field"><label>Doll name or temporary label</label><input className="input" value={newDoll.name} onChange={(e) => setNewDoll((p) => ({ ...p, name: e.target.value }))} /></div>
          <div className="field"><label>Artist name</label><input className="input" value={newDoll.artist_name} onChange={(e) => setNewDoll((p) => ({ ...p, artist_name: e.target.value }))} /></div>
          <div className="field"><label>Theme</label><select className="select" value={newDoll.theme_id} onChange={(e) => setNewDoll((p) => ({ ...p, theme_id: e.target.value }))}>{themes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          <div className="button-row"><button className="btn" disabled={saving} onClick={createDoll}>Create Intake Entry</button><button className="btn secondary" onClick={loadBase}>Refresh</button></div>
          <hr style={{ margin: '20px 0', border: 0, borderTop: '1px solid #e2e8f0' }} />
          <div className="small" style={{ marginBottom: 10 }}>Dolls</div>
          <div className="list">
            {loading ? <div className="small">Loading dolls…</div> : dolls.length === 0 ? <div className="small">No dolls yet. Add your first one.</div> : dolls.map((d) => (
              <div key={d.id} className={`card ${selectedId === d.id ? 'active' : ''}`} onClick={() => setSelectedId(d.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div className="card-title">{d.name || d.internal_id}</div>
                    <div className="card-meta">{d.internal_id} · {themes.find((t) => t.id === d.theme_id)?.name || 'Unassigned'}</div>
                  </div>
                  <span className="badge">{statusLabel(d.status)}</span>
                </div>
                <div className="progress"><div style={{ width: `${stageProgress(d.status)}%` }} /></div>
                <div className="card-meta">{stageProgress(d.status)}% through lifecycle</div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          {!selected ? <div className="small">Select a doll to continue.</div> : (
            <>
              <div className="section-top">
                <div>
                  <h2 style={{ marginBottom: 6 }}>{selected.name || selected.internal_id}</h2>
                  <div className="small">{selected.internal_id} · {selectedThemeName}</div>
                </div>
                <div className="button-row">
                  <button className="btn secondary" onClick={generateDraft}>Generate Draft</button>
                  <button className="btn" onClick={() => updateDollBase({ status: STATUSES[Math.min(STATUSES.indexOf(selected.status) + 1, STATUSES.length - 1)] })}>Advance Stage</button>
                </div>
              </div>

              <div className="progress" style={{ marginTop: 16 }}><div style={{ width: `${stageProgress(selected.status)}%` }} /></div>
              <div className="small">Lifecycle progress: {stageProgress(selected.status)}%</div>

              <div className="tabs">
                {TABS.map((name) => <button key={name} className={`tab ${tab === name ? 'active' : ''}`} onClick={() => setTab(name)}>{statusLabel(name)}</button>)}
              </div>

              {tab === 'identity' && (
                <>
                  <div className="grid2">
                    <div className="field"><label>Name</label><input className="input" value={selected.name || ''} onChange={(e) => setDolls((prev) => prev.map((d) => d.id === selected.id ? { ...d, name: e.target.value } : d))} /></div>
                    <div className="field"><label>Theme</label><select className="select" value={selected.theme_id || 'unassigned'} onChange={(e) => setDolls((prev) => prev.map((d) => d.id === selected.id ? { ...d, theme_id: e.target.value === 'unassigned' ? null : e.target.value } : d))}>{themes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                    <div className="field"><label>Personality traits</label><input className="input" value={selected.personality_traits || ''} onChange={(e) => setDolls((prev) => prev.map((d) => d.id === selected.id ? { ...d, personality_traits: e.target.value } : d))} /></div>
                    <div className="field"><label>Emotional hook</label><input className="input" value={selected.emotional_hook || ''} onChange={(e) => setDolls((prev) => prev.map((d) => d.id === selected.id ? { ...d, emotional_hook: e.target.value } : d))} /></div>
                  </div>
                  <div className="field"><label>Short intro</label><textarea className="textarea" value={selected.short_intro || ''} onChange={(e) => setDolls((prev) => prev.map((d) => d.id === selected.id ? { ...d, short_intro: e.target.value } : d))} /></div>
                  <button className="btn" disabled={saving} onClick={saveIdentity}>Save Identity</button>
                </>
              )}

              {tab === 'story' && (
                <>
                  <div className="field"><label>Card teaser</label><textarea className="textarea" value={storyPack.teaser} onChange={(e) => setStoryPack((p) => ({ ...p, teaser: e.target.value }))} /></div>
                  <div className="field"><label>Main story</label><textarea className="textarea" value={storyPack.main} onChange={(e) => setStoryPack((p) => ({ ...p, main: e.target.value }))} /></div>
                  <div className="grid2">
                    <div className="field"><label>Mini story 1</label><textarea className="textarea" value={storyPack.mini1} onChange={(e) => setStoryPack((p) => ({ ...p, mini1: e.target.value }))} /></div>
                    <div className="field"><label>Mini story 2</label><textarea className="textarea" value={storyPack.mini2} onChange={(e) => setStoryPack((p) => ({ ...p, mini2: e.target.value }))} /></div>
                  </div>
                  <button className="btn" disabled={saving} onClick={saveStories}>Save Story</button>
                </>
              )}

              {tab === 'digital' && (
                <>
                  <div className="field"><label>Page slug</label><input className="input" value={digitalPack.slug} onChange={(e) => setDigitalPack((p) => ({ ...p, slug: e.target.value }))} /></div>
                  <div className="field"><label>Hero text</label><textarea className="textarea" value={digitalPack.hero_text} onChange={(e) => setDigitalPack((p) => ({ ...p, hero_text: e.target.value }))} /></div>
                  <div className="placeholder">QR destination preview: {digitalPack.qr_url || 'No URL assigned yet'}</div>
                  <button className="btn" disabled={saving} onClick={saveDigital}>Save Digital Layer</button>
                </>
              )}

              {tab === 'content' && (
                <>
                  <div className="field"><label>Instagram caption</label><textarea className="textarea" value={contentPack.caption} onChange={(e) => setContentPack((p) => ({ ...p, caption: e.target.value }))} /></div>
                  <div className="field"><label>Visual prompt</label><textarea className="textarea" value={contentPack.visualPrompt} onChange={(e) => setContentPack((p) => ({ ...p, visualPrompt: e.target.value }))} /></div>
                  <button className="btn" disabled={saving} onClick={saveContent}>Save Content</button>
                </>
              )}

              {tab === 'sales' && (
                <div className="grid2">
                  <div className="field"><label>Availability</label><select className="select" value={selected.availability_status || 'available'} onChange={(e) => updateDollBase({ availability_status: e.target.value })}><option value="available">Available</option><option value="reserved">Reserved</option><option value="unavailable">Unavailable</option></select></div>
                  <div className="field"><label>Sales status</label><select className="select" value={selected.sales_status || 'not_sold'} onChange={(e) => updateDollBase({ sales_status: e.target.value })}><option value="not_sold">Not sold</option><option value="sold">Sold</option><option value="in_delivery">In delivery</option><option value="delivered">Delivered</option></select></div>
                </div>
              )}

              {tab === 'live' && <div className="placeholder">This section is reserved for the living universe manager: seasonal stories, activities, related dolls, and post-sale growth.</div>}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
