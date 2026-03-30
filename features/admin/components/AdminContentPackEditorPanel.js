"use client";

import { AdminVariationPanel } from "./AdminVariationPanel";

export function AdminContentPackEditorPanel({
  hasContentAssets,
  onGenerateContentPack,
  contentPackGenerating,
  onSaveContentPack,
  saveButtonStyle,
  saveDisabled,
  saveLabel,
  variations,
  selectedVariationId,
  onApplyVariationToEditor,
  contentPack,
  setContentPack,
  setSelectedVariationId,
  styles,
}) {
  return (
    <div style={panelStackStyle}>
      {!hasContentAssets ? (
        <div style={styles.hintStackStyle}>
          <div style={styles.operatorHintStyle("muted")}>
            Add content assets to expand the digital experience.
          </div>
        </div>
      ) : null}

      <div style={headerRowStyle}>
        <div style={titleStyle}>Content Pack</div>
        <div style={toolbarStyle}>
          <button
            type="button"
            onClick={onGenerateContentPack}
            style={styles.primaryButton}
            disabled={contentPackGenerating}
          >
            {contentPackGenerating ? "Generating..." : "Generate with AI"}
          </button>
          <button
            type="button"
            onClick={onSaveContentPack}
            style={saveButtonStyle}
            disabled={saveDisabled}
          >
            {saveLabel}
          </button>
        </div>
      </div>

      <AdminVariationPanel
        title="Content Pack Variations"
        hint="Choose the version to place in the editable fields. Saving still happens only when you click Save Content Pack."
        variations={variations}
        selectedVariationId={selectedVariationId}
        onSelectVariation={onApplyVariationToEditor}
        renderPreview={(variation) => (
          <div style={styles.contentPackVariationPreviewStackStyle}>
            <div style={styles.contentPackVariationPreviewBlockStyle}>
              <div style={styles.contentPackVariationPreviewLabelStyle}>Short intro</div>
              <p className="admin-variation-preview" style={styles.storyVariationPreviewStyle}>
                {truncateText(variation.short_intro, 140)}
              </p>
            </div>

            <div style={styles.contentPackVariationPreviewBlockStyle}>
              <div style={styles.contentPackVariationPreviewLabelStyle}>Content blurb</div>
              <p className="admin-variation-preview" style={styles.storyVariationPreviewStyle}>
                {truncateText(variation.content_blurb, 200)}
              </p>
            </div>
          </div>
        )}
        styles={styles.variationPanelStyles}
      />

      <div style={styles.contentCardStyle}>
        <div style={styles.sectionLabelStyle}>Instagram Caption</div>
        <textarea
          value={contentPack.caption}
          onChange={(event) => {
            setSelectedVariationId("");
            setContentPack({
              ...contentPack,
              caption: event.target.value,
            });
          }}
          style={{ ...styles.inputStyle, minHeight: 140 }}
        />
      </div>

      <div style={styles.contentGridStyle}>
        <div style={styles.contentCardStyle}>
          <div style={styles.sectionLabelStyle}>Short Promo Hook</div>
          <textarea
            value={contentPack.hook}
            onChange={(event) => {
              setSelectedVariationId("");
              setContentPack({
                ...contentPack,
                hook: event.target.value,
              });
            }}
            style={{ ...styles.inputStyle, minHeight: 120 }}
          />
        </div>

        <div style={styles.contentCardStyle}>
          <div style={styles.sectionLabelStyle}>CTA</div>
          <textarea
            value={contentPack.cta}
            onChange={(event) => {
              setSelectedVariationId("");
              setContentPack({
                ...contentPack,
                cta: event.target.value,
              });
            }}
            style={{ ...styles.inputStyle, minHeight: 120 }}
          />
        </div>
      </div>

      <div style={styles.contentCardStyle}>
        <div style={styles.sectionLabelStyle}>Product Blurb</div>
        <textarea
          value={contentPack.blurb}
          onChange={(event) => {
            setSelectedVariationId("");
            setContentPack({
              ...contentPack,
              blurb: event.target.value,
            });
          }}
          style={{ ...styles.inputStyle, minHeight: 140 }}
        />
      </div>
    </div>
  );
}

function truncateText(value, length) {
  if (value.length <= length) {
    return value;
  }

  return `${value.slice(0, length).trimEnd()}...`;
}

const panelStackStyle = {
  display: "grid",
  gap: 20,
};

const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const titleStyle = {
  fontWeight: 700,
};

const toolbarStyle = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};
