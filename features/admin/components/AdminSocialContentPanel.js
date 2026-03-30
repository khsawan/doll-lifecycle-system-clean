"use client";

import { AdminVariationPanel } from "./AdminVariationPanel";

export function AdminSocialContentPanel({
  onGenerateSocialContent,
  socialGenerating,
  onSaveSocialContent,
  saveButtonStyle,
  saveDisabled,
  saveLabel,
  variations,
  selectedVariationId,
  onApplyVariationToEditor,
  identity,
  setIdentity,
  setSelectedVariationId,
  styles,
}) {
  return (
    <div style={styles.contentCardStyle}>
      <div style={headerRowStyle}>
        <div style={{ ...styles.sectionLabelStyle, marginBottom: 0 }}>Social Content</div>
        <div style={toolbarStyle}>
          <button
            type="button"
            onClick={onGenerateSocialContent}
            style={styles.primaryButton}
            disabled={socialGenerating}
          >
            {socialGenerating ? "Generating..." : "Generate with AI"}
          </button>
          <button
            type="button"
            onClick={onSaveSocialContent}
            style={saveButtonStyle}
            disabled={saveDisabled}
          >
            {saveLabel}
          </button>
        </div>
      </div>

      <AdminVariationPanel
        title="Social Variations"
        hint="Choose the version to place in the editable fields. Saving still happens only when you click Save Social Content."
        variations={variations}
        selectedVariationId={selectedVariationId}
        onSelectVariation={onApplyVariationToEditor}
        renderPreview={(variation) => (
          <div style={styles.contentPackVariationPreviewStackStyle}>
            <div style={styles.contentPackVariationPreviewBlockStyle}>
              <div style={styles.contentPackVariationPreviewLabelStyle}>Hook</div>
              <p className="admin-variation-preview" style={styles.storyVariationPreviewStyle}>
                {truncateText(variation.social_hook, 120)}
              </p>
            </div>

            <div style={styles.contentPackVariationPreviewBlockStyle}>
              <div style={styles.contentPackVariationPreviewLabelStyle}>Caption preview</div>
              <p className="admin-variation-preview" style={styles.storyVariationPreviewStyle}>
                {truncateText(variation.social_caption, 120)}
              </p>
            </div>
          </div>
        )}
        styles={styles.variationPanelStyles}
      />

      <div style={socialFieldStackStyle}>
        <div>
          <label style={styles.labelStyle}>Hook</label>
          <input
            value={identity.social_hook}
            onChange={(event) => {
              setSelectedVariationId("");
              setIdentity({
                ...identity,
                social_hook: event.target.value,
              });
            }}
            style={styles.inputStyle}
          />
        </div>

        <div>
          <label style={styles.labelStyle}>Caption</label>
          <textarea
            value={identity.social_caption}
            onChange={(event) => {
              setSelectedVariationId("");
              setIdentity({
                ...identity,
                social_caption: event.target.value,
              });
            }}
            style={{ ...styles.inputStyle, minHeight: 140, resize: "vertical" }}
          />
        </div>

        <div>
          <label style={styles.labelStyle}>CTA</label>
          <input
            value={identity.social_cta}
            onChange={(event) => {
              setSelectedVariationId("");
              setIdentity({
                ...identity,
                social_cta: event.target.value,
              });
            }}
            style={styles.inputStyle}
          />
        </div>

        <div>
          <label style={styles.labelStyle}>Social Status</label>
          <select
            value={identity.social_status}
            onChange={(event) =>
              setIdentity({
                ...identity,
                social_status: event.target.value,
              })
            }
            style={styles.inputStyle}
          >
            <option value="draft">Draft</option>
            <option value="ready_to_post">Ready to Post</option>
            <option value="posted">Posted</option>
          </select>
        </div>
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

const headerRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 12,
};

const toolbarStyle = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const socialFieldStackStyle = {
  display: "grid",
  gap: 16,
};
