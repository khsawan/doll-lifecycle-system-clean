"use client";

export function AdminDangerZonePanel({
  dangerAction,
  dangerLoading,
  archiveWarningMessage,
  deleteWarningMessage,
  dangerNeedsTypedDelete,
  dangerConfirmText,
  onDangerConfirmTextChange,
  requestArchiveDoll,
  requestPermanentDelete,
  cancelDangerAction,
  archiveDoll,
  deleteDollPermanently,
  styles,
}) {
  return (
    <div style={styles.dangerZoneStyle}>
      <div style={styles.dangerZoneLabelStyle}>Danger Zone</div>
      <div style={styles.dangerZoneTitleStyle}>Archive or permanently remove this doll</div>
      <p style={styles.dangerZoneTextStyle}>
        Use these actions only when you need to retire a doll from the active lifecycle or remove
        its digital identity completely. Archiving keeps everything intact. Permanent deletion
        removes the doll, its public story data, QR identity, and linked order records.
      </p>

      <div style={dangerActionRowStyle}>
        <button
          type="button"
          onClick={requestArchiveDoll}
          style={styles.secondaryButton}
          disabled={dangerLoading === "archive" || dangerLoading === "delete"}
        >
          {dangerLoading === "archive" ? "Archiving..." : "Archive Doll"}
        </button>

        <button
          type="button"
          onClick={requestPermanentDelete}
          style={styles.dangerButton}
          disabled={dangerLoading === "archive" || dangerLoading === "delete"}
        >
          {dangerLoading === "delete" ? "Deleting..." : "Delete Permanently"}
        </button>
      </div>

      {dangerAction === "archive" ? (
        <div style={styles.dangerConfirmCardStyle}>
          <div style={styles.dangerConfirmTitleStyle}>Archive this doll?</div>
          <div style={styles.dangerConfirmTextStyle}>{archiveWarningMessage}</div>
          <div style={dangerActionRowWithMarginStyle}>
            <button
              type="button"
              onClick={cancelDangerAction}
              style={styles.secondaryButton}
              disabled={dangerLoading === "archive"}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={archiveDoll}
              style={styles.primaryButton}
              disabled={dangerLoading === "archive"}
            >
              {dangerLoading === "archive" ? "Archiving..." : "Archive Doll"}
            </button>
          </div>
        </div>
      ) : null}

      {dangerAction === "delete" ? (
        <div style={styles.dangerConfirmCardStyle}>
          <div style={styles.dangerConfirmTitleStyle}>Delete this doll permanently?</div>
          <div style={styles.dangerConfirmTextStyle}>{deleteWarningMessage}</div>
          <div style={{ ...styles.dangerConfirmTextStyle, marginTop: 10 }}>
            This will remove the doll&apos;s public page content, QR identity, stories, content
            assets, orders, and linked uploaded files.
          </div>

          {dangerNeedsTypedDelete ? (
            <div style={confirmInputWrapStyle}>
              <label style={styles.labelStyle}>Type DELETE to confirm</label>
              <input
                value={dangerConfirmText}
                onChange={(event) => onDangerConfirmTextChange(event.target.value)}
                style={styles.inputStyle}
              />
            </div>
          ) : null}

          <div style={dangerActionRowWithMarginStyle}>
            <button
              type="button"
              onClick={cancelDangerAction}
              style={styles.secondaryButton}
              disabled={dangerLoading === "delete"}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={deleteDollPermanently}
              style={styles.dangerButton}
              disabled={
                dangerLoading === "delete" ||
                (dangerNeedsTypedDelete && dangerConfirmText !== "DELETE")
              }
            >
              {dangerLoading === "delete" ? "Deleting..." : "Delete Permanently"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const dangerActionRowStyle = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const dangerActionRowWithMarginStyle = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 14,
};

const confirmInputWrapStyle = {
  marginTop: 14,
};
