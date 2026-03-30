"use client";

import { AdminVariationPanel } from "./AdminVariationPanel";

export function AdminStoryEditorPanel({
  hasStoryContent,
  storyTone,
  onStoryToneChange,
  storyTones,
  onApplyTone,
  storyGenerating,
  onSaveStory,
  saveButtonStyle,
  saveDisabled,
  saveLabel,
  variations,
  selectedVariationId,
  onApplyVariationToEditor,
  story,
  setStory,
  setSelectedVariationId,
  styles,
}) {
  return (
    <div>
      {!hasStoryContent ? (
        <div style={{ ...styles.hintStackStyle, marginBottom: 16 }}>
          <div style={styles.operatorHintStyle("muted")}>
            Add a story to enrich the doll&apos;s identity.
          </div>
        </div>
      ) : null}

      <div style={engineCardStyle}>
        <div style={engineHeaderStyle}>
          <div style={engineTitleStyle}>Story Engine v2</div>
          <div style={toolbarStyle}>
            <button
              type="button"
              onClick={() => onApplyTone(storyTone)}
              style={styles.primaryButton}
              disabled={storyGenerating}
            >
              {storyGenerating ? "Generating..." : "Generate with AI"}
            </button>
            <button type="button" onClick={onSaveStory} style={saveButtonStyle} disabled={saveDisabled}>
              {saveLabel}
            </button>
          </div>
        </div>

        <div style={toneRowStyle}>
          <label style={toneLabelStyle}>Tone</label>

          <select
            value={storyTone}
            onChange={(event) => onStoryToneChange(event.target.value)}
            style={{ ...styles.inputStyle, width: 180 }}
          >
            {storyTones.map((tone) => (
              <option key={tone} value={tone}>
                {tone}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => onApplyTone("Gentle")}
            style={styles.secondaryButton}
            disabled={storyGenerating}
          >
            Gentle
          </button>
          <button
            type="button"
            onClick={() => onApplyTone("Playful")}
            style={styles.secondaryButton}
            disabled={storyGenerating}
          >
            Playful
          </button>
          <button
            type="button"
            onClick={() => onApplyTone("Magical")}
            style={styles.secondaryButton}
            disabled={storyGenerating}
          >
            Magical
          </button>
        </div>
      </div>

      <AdminVariationPanel
        title="Story Variations"
        hint="Choose the version to place in the Main story field. Saving still happens only when you click Save Story."
        variations={variations}
        selectedVariationId={selectedVariationId}
        onSelectVariation={onApplyVariationToEditor}
        renderPreview={(variation) => (
          <p className="admin-variation-preview" style={styles.storyVariationPreviewStyle}>
            {truncateText(variation.story_main, 240)}
          </p>
        )}
        styles={styles.variationPanelStyles}
      />

      <div>
        <label style={styles.labelStyle}>Card teaser</label>
        <textarea
          value={story.teaser}
          onChange={(event) =>
            setStory({
              ...story,
              teaser: event.target.value,
            })
          }
          style={{ ...styles.inputStyle, minHeight: 120 }}
        />
      </div>

      <div style={sectionSpacingStyle}>
        <label style={styles.labelStyle}>Main story</label>
        <textarea
          value={story.mainStory}
          onChange={(event) => {
            setSelectedVariationId("");
            setStory({
              ...story,
              mainStory: event.target.value,
            });
          }}
          style={{ ...styles.inputStyle, minHeight: 120 }}
        />
      </div>

      <div style={storyMiniGridStyle}>
        <div>
          <label style={styles.labelStyle}>Mini story 1</label>
          <textarea
            value={story.mini1}
            onChange={(event) =>
              setStory({
                ...story,
                mini1: event.target.value,
              })
            }
            style={{ ...styles.inputStyle, minHeight: 120 }}
          />
        </div>

        <div>
          <label style={styles.labelStyle}>Mini story 2</label>
          <textarea
            value={story.mini2}
            onChange={(event) =>
              setStory({
                ...story,
                mini2: event.target.value,
              })
            }
            style={{ ...styles.inputStyle, minHeight: 120 }}
          />
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

const engineCardStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  padding: 16,
  marginBottom: 20,
};

const engineHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 12,
};

const engineTitleStyle = {
  fontWeight: 700,
};

const toolbarStyle = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const toneRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const toneLabelStyle = {
  color: "#475569",
};

const sectionSpacingStyle = {
  marginTop: 16,
};

const storyMiniGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
  marginTop: 16,
};
