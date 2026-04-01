"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAdminUniverses, fetchAdminUniverseDetail } from "../services/universeApi";

const DOLLS_ENDPOINT = (dollId) =>
  `/api/admin/dolls/${encodeURIComponent(String(dollId))}`;

async function assignDollToUniverse(fetcher, dollId, universeId) {
  const response = await fetcher(DOLLS_ENDPOINT(dollId), {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ patch: { universe_id: universeId } }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      typeof body?.error === "string" ? body.error : "Failed to assign doll."
    );
  }
  return body;
}

export function AdminUniversePanel() {
  const fetcher = typeof fetch === "undefined" ? null : fetch;

  // View state: 'list' | 'detail'
  const [view, setView] = useState("list");

  // List state
  const [universes, setUniverses] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  // Detail state
  const [selectedUniverse, setSelectedUniverse] = useState(null);
  const [assignedDolls, setAssignedDolls] = useState([]);
  const [unassignedDolls, setUnassignedDolls] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");

  // Assignment state
  const [assigningDollId, setAssigningDollId] = useState(null);
  const [assignError, setAssignError] = useState("");
  const [assignNotice, setAssignNotice] = useState("");

  const loadList = useCallback(async () => {
    if (!fetcher) return;
    setLoadingList(true);
    setListError("");
    try {
      const data = await fetchAdminUniverses(fetcher);
      setUniverses(data);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load universes.");
    } finally {
      setLoadingList(false);
    }
  }, [fetcher]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const loadDetail = useCallback(
    async (universeId) => {
      if (!fetcher) return;
      setLoadingDetail(true);
      setDetailError("");
      setAssignError("");
      setAssignNotice("");
      try {
        const data = await fetchAdminUniverseDetail(fetcher, universeId);
        if (data.universe) {
          setSelectedUniverse(data.universe);
        }
        setAssignedDolls(data.assignedDolls);
        setUnassignedDolls(data.unassignedDolls);
      } catch (err) {
        setDetailError(err instanceof Error ? err.message : "Failed to load universe detail.");
      } finally {
        setLoadingDetail(false);
      }
    },
    [fetcher]
  );

  function openDetail(universe) {
    setSelectedUniverse(universe);
    setAssignedDolls([]);
    setUnassignedDolls([]);
    setAssignError("");
    setAssignNotice("");
    setView("detail");
    void loadDetail(universe.id);
  }

  function goBack() {
    setView("list");
    setSelectedUniverse(null);
    setAssignedDolls([]);
    setUnassignedDolls([]);
    setAssignError("");
    setAssignNotice("");
    void loadList();
  }

  async function handleAssignDoll(dollId) {
    if (!fetcher || !selectedUniverse || assigningDollId) return;
    setAssigningDollId(dollId);
    setAssignError("");
    setAssignNotice("");
    try {
      await assignDollToUniverse(fetcher, dollId, selectedUniverse.id);
      setAssignNotice("Doll assigned.");
      await loadDetail(selectedUniverse.id);
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : "Failed to assign doll.");
    } finally {
      setAssigningDollId(null);
    }
  }

  if (view === "detail") {
    return (
      <DetailView
        universe={selectedUniverse}
        assignedDolls={assignedDolls}
        unassignedDolls={unassignedDolls}
        loading={loadingDetail}
        error={detailError}
        assigningDollId={assigningDollId}
        assignError={assignError}
        assignNotice={assignNotice}
        onBack={goBack}
        onAssignDoll={handleAssignDoll}
      />
    );
  }

  return (
    <ListView
      universes={universes}
      loading={loadingList}
      error={listError}
      onSelect={openDetail}
    />
  );
}

function ListView({ universes, loading, error, onSelect }) {
  if (loading) {
    return <div style={loadingStyle}>Loading universes...</div>;
  }

  return (
    <div style={panelStyle}>
      <div style={panelHeaderStyle}>
        <div style={titleStyle}>Universes</div>
      </div>

      {error ? <div style={errorBannerStyle}>{error}</div> : null}

      {universes.length === 0 && !error ? (
        <div style={mutedTextStyle}>No universes found.</div>
      ) : null}

      <div style={cardStackStyle}>
        {universes.map((universe) => {
          const dollCount = universe.doll_count ?? 0;
          return (
            <button
              key={universe.id}
              type="button"
              onClick={() => onSelect(universe)}
              style={universeRowStyle}
            >
              <div style={rowMainStyle}>
                <div style={universeNameStyle}>{universe.name}</div>
                <div style={tagRowStyle}>
                  {universe.emotional_core ? (
                    <span style={coreTagStyle}>{universe.emotional_core}</span>
                  ) : null}
                  <span style={statusTagStyle(universe.status)}>{universe.status}</span>
                  <span style={countTagStyle}>
                    {dollCount} {dollCount === 1 ? "doll" : "dolls"}
                  </span>
                </div>
              </div>
              <span style={chevronStyle}>›</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DetailView({
  universe,
  assignedDolls,
  unassignedDolls,
  loading,
  error,
  assigningDollId,
  assignError,
  assignNotice,
  onBack,
  onAssignDoll,
}) {
  const toneRules = universe?.tone_rules || {};

  return (
    <div style={panelStyle}>
      <div style={detailHeaderStyle}>
        <button type="button" onClick={onBack} style={backButtonStyle}>
          ← Universes
        </button>
      </div>

      {universe ? (
        <div style={detailCardStyle}>
          <div style={titleStyle}>{universe.name}</div>

          {universe.description ? (
            <div style={descriptionStyle}>{universe.description}</div>
          ) : null}

          <div style={metaGridStyle}>
            {universe.emotional_core ? (
              <div style={metaFieldStyle}>
                <div style={metaLabelStyle}>Emotional Core</div>
                <div style={metaValueStyle}>{universe.emotional_core}</div>
              </div>
            ) : null}
            {toneRules.voice_register ? (
              <div style={metaFieldStyle}>
                <div style={metaLabelStyle}>Voice Register</div>
                <div style={metaValueStyle}>{toneRules.voice_register}</div>
              </div>
            ) : null}
            {toneRules.tonal_axis ? (
              <div style={metaFieldStyle}>
                <div style={metaLabelStyle}>Tonal Axis</div>
                <div style={metaValueStyle}>{toneRules.tonal_axis}</div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {loading ? <div style={loadingStyle}>Loading detail...</div> : null}
      {error ? <div style={errorBannerStyle}>{error}</div> : null}

      {!loading && !error ? (
        <>
          <div style={sectionStyle}>
            <div style={sectionHeadingStyle}>
              Assigned Dolls{" "}
              <span style={sectionCountStyle}>({assignedDolls.length})</span>
            </div>
            {assignedDolls.length === 0 ? (
              <div style={mutedTextStyle}>No dolls assigned to this universe.</div>
            ) : (
              <div style={dollStackStyle}>
                {assignedDolls.map((doll) => (
                  <div key={doll.id} style={assignedDollRowStyle}>
                    <div style={dollNameStyle}>{doll.name}</div>
                    {doll.theme_name ? (
                      <div style={dollMetaStyle}>{doll.theme_name}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={sectionStyle}>
            <div style={sectionHeadingStyle}>
              Unassigned Dolls{" "}
              <span style={sectionCountStyle}>({unassignedDolls.length})</span>
            </div>

            {assignNotice ? (
              <div style={noticeBannerStyle}>{assignNotice}</div>
            ) : null}
            {assignError ? (
              <div style={errorBannerStyle}>{assignError}</div>
            ) : null}

            {unassignedDolls.length === 0 ? (
              <div style={mutedTextStyle}>No unassigned dolls.</div>
            ) : (
              <div style={dollStackStyle}>
                {unassignedDolls.map((doll) => {
                  const isAssigning = assigningDollId === doll.id;
                  const isBusy = !!assigningDollId;
                  return (
                    <button
                      key={doll.id}
                      type="button"
                      onClick={() => onAssignDoll(doll.id)}
                      disabled={isBusy}
                      style={unassignedDollButtonStyle(isBusy)}
                    >
                      <div>
                        <div style={dollNameStyle}>{doll.name}</div>
                        {doll.theme_name ? (
                          <div style={dollMetaStyle}>{doll.theme_name}</div>
                        ) : null}
                      </div>
                      <span style={assignLabelStyle}>
                        {isAssigning ? "Assigning..." : "Assign →"}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const panelStyle = {
  display: "grid",
  gap: 20,
};

const panelHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
};

const detailHeaderStyle = {
  display: "flex",
  alignItems: "center",
};

const titleStyle = {
  fontSize: 22,
  fontWeight: 700,
  color: "#0f172a",
  margin: 0,
};

const loadingStyle = {
  color: "#64748b",
  padding: "12px 0",
};

const mutedTextStyle = {
  color: "#94a3b8",
  fontSize: 14,
};

const errorBannerStyle = {
  background: "#fef2f2",
  color: "#b91c1c",
  border: "1px solid #fecaca",
  borderRadius: 12,
  padding: "10px 14px",
  fontSize: 14,
};

const noticeBannerStyle = {
  background: "#f0fdf4",
  color: "#166534",
  border: "1px solid #bbf7d0",
  borderRadius: 12,
  padding: "10px 14px",
  fontSize: 14,
};

const cardStackStyle = {
  display: "grid",
  gap: 10,
};

const universeRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: "14px 16px",
  cursor: "pointer",
  textAlign: "left",
  width: "100%",
  transition: "border-color 120ms ease",
};

const rowMainStyle = {
  display: "grid",
  gap: 6,
  minWidth: 0,
};

const tagRowStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
  alignItems: "center",
};

const universeNameStyle = {
  fontWeight: 700,
  fontSize: 16,
  color: "#0f172a",
};

const coreTagStyle = {
  fontSize: 12,
  background: "#f0fdf4",
  color: "#166534",
  border: "1px solid #bbf7d0",
  borderRadius: 10,
  padding: "2px 8px",
};

function statusTagStyle(status) {
  return {
    fontSize: 12,
    background: status === "active" ? "#ecfdf5" : "#fef9c3",
    color: status === "active" ? "#166534" : "#713f12",
    border: `1px solid ${status === "active" ? "#86efac" : "#fde68a"}`,
    borderRadius: 10,
    padding: "2px 8px",
  };
}

const countTagStyle = {
  fontSize: 12,
  color: "#94a3b8",
};

const chevronStyle = {
  fontSize: 20,
  color: "#94a3b8",
  flexShrink: 0,
};

const backButtonStyle = {
  background: "transparent",
  border: "none",
  color: "#475569",
  fontSize: 14,
  cursor: "pointer",
  padding: "4px 0",
};

const detailCardStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 18,
  display: "grid",
  gap: 12,
};

const descriptionStyle = {
  fontSize: 14,
  color: "#475569",
  lineHeight: 1.6,
};

const metaGridStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 16,
};

const metaFieldStyle = {
  display: "grid",
  gap: 2,
};

const metaLabelStyle = {
  fontSize: 12,
  color: "#94a3b8",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const metaValueStyle = {
  fontSize: 14,
  color: "#0f172a",
  fontWeight: 500,
};

const sectionStyle = {
  display: "grid",
  gap: 10,
};

const sectionHeadingStyle = {
  fontSize: 14,
  fontWeight: 700,
  color: "#0f172a",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const sectionCountStyle = {
  color: "#94a3b8",
  fontWeight: 400,
};

const dollStackStyle = {
  display: "grid",
  gap: 8,
};

const assignedDollRowStyle = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: "10px 14px",
};

const dollNameStyle = {
  fontWeight: 600,
  fontSize: 14,
  color: "#0f172a",
};

const dollMetaStyle = {
  fontSize: 13,
  color: "#64748b",
  marginTop: 2,
};

function unassignedDollButtonStyle(isBusy) {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: 12,
    padding: "10px 14px",
    cursor: isBusy ? "not-allowed" : "pointer",
    opacity: isBusy ? 0.6 : 1,
    textAlign: "left",
    width: "100%",
    transition: "border-color 120ms ease",
  };
}

const assignLabelStyle = {
  fontSize: 13,
  color: "#0f172a",
  fontWeight: 600,
  flexShrink: 0,
};
