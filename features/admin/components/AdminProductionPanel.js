"use client";

import Image from "next/image";

export function AdminProductionPanel({
  isEditable,
  dollIdentity,
  identity,
  setIdentity,
  hasImage,
  onUploadImage,
  onSaveIdentity,
  autoResizeTextarea,
  styles,
}) {
  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    await onUploadImage(file);
  }

  return (
    <div style={departmentStackStyle}>
      <fieldset
        disabled={!isEditable}
        style={{
          ...fieldsetStyle,
          opacity: isEditable ? 1 : 0.84,
        }}
      >
        <div className="doll-identity-card" style={styles.dollIdentityCardStyle}>
          <div style={styles.dollIdentityHeaderRowStyle}>
            <div style={styles.dollIdentityLeadStyle}>
              <div style={styles.dollIdentityPrimaryStyle}>
                <div style={styles.dollIdentityNameStyle}>
                  {dollIdentity.name || "Untitled doll"}
                </div>
                <div style={styles.dollIdentitySupportingInfoStyle}>
                  <div style={styles.dollIdentityIdStyle}>
                    {dollIdentity.internalId || "Not assigned"}
                  </div>
                  <div aria-hidden="true" style={styles.dollIdentityInfoDividerStyle} />
                  <div style={styles.dollIdentityThemeStyle}>{dollIdentity.collection}</div>
                </div>
              </div>
            </div>
          </div>

          <div aria-hidden="true" style={styles.dollIdentityDividerStyle} />

          <div className="doll-identity-meta-strip" style={styles.dollIdentityMetaStripStyle}>
            <div style={styles.dollIdentityMetaStyle}>
              <div style={styles.dollIdentityMetaLabelStyle}>Artist</div>
              <div style={styles.dollIdentityMetaValueStyle(dollIdentity.artistIsEmpty)}>
                {dollIdentity.artistDisplay}
              </div>
              {dollIdentity.artistIsEmpty ? (
                <div style={styles.dollIdentityMetaHintStyle}>Assignment pending</div>
              ) : null}
            </div>

            <div style={styles.dollIdentityMetaStyle}>
              <div style={styles.dollIdentityMetaLabelStyle}>Collection</div>
              <div
                style={styles.dollIdentityMetaValueStyle(
                  dollIdentity.collection === "Unassigned"
                )}
              >
                {dollIdentity.collection}
              </div>
            </div>

            <div style={styles.dollIdentityStatusStyle}>
              <div style={styles.dollIdentityStageBadgeStyle(dollIdentity.workflowStageStatus)}>
                {dollIdentity.workflowStageLabel}
              </div>
              <div style={styles.dollIdentityStatusStateStyle(dollIdentity.workflowStageStatus)}>
                {dollIdentity.workflowState}
              </div>
            </div>
          </div>
        </div>

        <div style={styles.digitalCardStyle}>
          <div style={styles.subduedSectionLabelStyle}>Physical Doll</div>
          <div style={physicalSectionCopyStyle}>
            Define the physical appearance of the doll.
          </div>
          <div style={{ ...styles.subduedSectionLabelStyle, marginBottom: 12 }}>
            Visual Block
          </div>

          <div style={styles.visualPlaceholderStyle}>
            <div style={{ width: "100%" }}>
              {identity.image_url ? (
                <Image
                  src={identity.image_url}
                  alt="Doll"
                  width={1200}
                  height={1200}
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 520px"
                  style={imageStyle}
                />
              ) : (
                <div>
                  <div style={emptyImageTitleStyle}>No image yet</div>
                  <div style={emptyImageHintStyle}>Upload a doll image</div>
                </div>
              )}

              {!hasImage ? (
                <div style={styles.inlineValidationHintStyle}>
                  Add a doll image to complete production.
                </div>
              ) : null}

              <input
                type="file"
                accept="image/*"
                style={fileInputStyle}
                onChange={handleImageChange}
              />
            </div>
          </div>
        </div>

        <div style={fieldStackStyle}>
          <div style={styles.contentCardStyle}>
            <label style={styles.labelStyle}>Color Palette</label>
            <input
              value={identity.color_palette}
              onChange={(event) =>
                setIdentity({
                  ...identity,
                  color_palette: event.target.value,
                })
              }
              style={styles.inputStyle}
            />
            {!identity.color_palette?.trim() ? (
              <div style={styles.inlineValidationHintStyle}>Add a color palette.</div>
            ) : null}
          </div>

          <div style={styles.contentCardStyle}>
            <label style={styles.labelStyle}>Notable Features</label>
            <textarea
              value={identity.notable_features}
              onChange={(event) => {
                autoResizeTextarea(event.currentTarget);
                setIdentity({
                  ...identity,
                  notable_features: event.target.value,
                });
              }}
              ref={autoResizeTextarea}
              style={notableFeaturesStyle(styles.inputStyle)}
            />
            {!identity.notable_features?.trim() ? (
              <div style={styles.inlineValidationHintStyle}>
                Describe the key physical features.
              </div>
            ) : null}
          </div>
        </div>

        <div style={saveRowStyle}>
          <button type="button" onClick={onSaveIdentity} style={styles.primaryButton}>
            Save Production Details
          </button>
        </div>
      </fieldset>
    </div>
  );
}

const departmentStackStyle = {
  marginTop: 14,
  display: "grid",
  gap: 20,
};

const fieldsetStyle = {
  border: "none",
  padding: 0,
  margin: 0,
  minInlineSize: 0,
  display: "grid",
  gap: 18,
};

const physicalSectionCopyStyle = {
  color: "#64748b",
  fontSize: 15,
  marginTop: -2,
  marginBottom: 14,
};

const imageStyle = {
  width: "100%",
  height: "auto",
  display: "block",
  borderRadius: 16,
  objectFit: "cover",
  maxHeight: 360,
};

const emptyImageTitleStyle = {
  fontWeight: 700,
  marginBottom: 6,
};

const emptyImageHintStyle = {
  fontSize: 14,
  color: "#64748b",
};

const fileInputStyle = {
  marginTop: 12,
};

const fieldStackStyle = {
  display: "grid",
  gap: 16,
};

function notableFeaturesStyle(inputStyle) {
  return {
    ...inputStyle,
    minHeight: 160,
    resize: "none",
    overflow: "hidden",
  };
}

const saveRowStyle = {
  paddingTop: 4,
};
