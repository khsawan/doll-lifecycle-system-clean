"use client";

export function AdminVariationPanel({
  title,
  hint,
  variations,
  selectedVariationId,
  onSelectVariation,
  renderPreview,
  styles,
}) {
  if (!variations?.length) {
    return null;
  }

  return (
    <div style={styles.panelStyle}>
      <div style={styles.panelHeaderStyle}>
        <div>
          <div style={styles.panelTitleStyle}>{title}</div>
          <div style={styles.panelHintStyle}>{hint}</div>
        </div>
      </div>

      <div style={styles.gridStyle}>
        {variations.map((variation) => {
          const isSelected = selectedVariationId === variation.id;

          return (
            <div
              key={variation.id}
              className={`admin-variation-card${isSelected ? " is-selected" : ""}`}
              style={styles.cardStyle(isSelected)}
            >
              <div style={styles.cardHeaderStyle}>
                <div style={styles.cardLabelStyle}>{variation.label}</div>
                <div style={styles.badgeStyle(isSelected)}>
                  {isSelected ? "Selected" : variation.id.toUpperCase()}
                </div>
              </div>

              {renderPreview(variation)}

              <button
                type="button"
                onClick={() => onSelectVariation(variation)}
                className="admin-variation-button"
                style={styles.actionStyle(isSelected)}
                disabled={isSelected}
              >
                {isSelected ? "Selected in editor" : "Use this version"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
