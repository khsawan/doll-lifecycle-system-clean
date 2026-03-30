"use client";

import Image from "next/image";

export function AdminDigitalIdentityPanel({
  selectedSlug,
  onCopySlug,
  dataQualityHints,
  digitalHints,
  hasQrIdentity,
  qrIsSensitive,
  qrSensitivityLabel,
  publicUrl,
  publicPath,
  qrSensitivityText,
  qrDataUrl,
  selectedName,
  qrStatus,
  onPrepareDigitalIdentity,
  isGatewayEditable,
  savedQrUrl,
  onGenerateQr,
  onRequestQrRegeneration,
  qrUploading,
  qrReady,
  onOpenPublicPage,
  onCopyPublicUrl,
  onDownloadQr,
  onDownloadPrintCard,
  qrReadinessMessage,
  showQrRegenerateWarning,
  onCancelQrRegenerateWarning,
  qrWarningMessage,
  onConfirmQrRegeneration,
  printCardRef,
  identityName,
  identityImageUrl,
  hasImage,
  onUploadImage,
  styles,
}) {
  return (
    <div style={panelStackStyle}>
      <div style={styles.digitalCardStyle}>
        <div style={styles.sectionLabelStyle}>Slug</div>
        <div style={styles.slugRowStyle}>
          <code style={styles.slugCodeStyle}>{selectedSlug || "no-slug-yet"}</code>
          <button type="button" onClick={onCopySlug} style={styles.secondaryButton}>
            Copy Slug
          </button>
        </div>
        {dataQualityHints.length ? (
          <div style={{ ...styles.hintStackStyle, marginTop: 12 }}>
            {dataQualityHints.map((hint) => (
              <div key={hint} style={styles.operatorHintStyle("warn")}>
                {hint}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div style={styles.digitalGridStyle}>
        <div style={styles.digitalCardStyle}>
          <div style={styles.digitalHeaderStyle}>
            <div>
              <div style={styles.sectionLabelStyle}>Digital Identity</div>
              <p style={styles.mutedTextStyle}>
                QR codes are managed here as a system-generated asset tied to this doll&apos;s public
                page.
              </p>
              <div style={{ ...styles.hintStackStyle, marginTop: 12 }}>
                {digitalHints.map((hint, index) => (
                  <div
                    key={`${hint}-${index}`}
                    style={styles.operatorHintStyle(index === 0 && !hasQrIdentity ? "warn" : "muted")}
                  >
                    {hint}
                  </div>
                ))}
              </div>
            </div>
            <div style={styles.digitalStatusPillStyle(qrIsSensitive)}>{qrSensitivityLabel}</div>
          </div>

          <div style={styles.digitalInfoBoxStyle}>
            <div style={styles.digitalInfoTitleStyle}>Public URL</div>
            <code style={styles.urlCodeStyle}>{publicUrl || publicPath || "/doll/your-doll-slug"}</code>
            <div style={styles.digitalInfoTextStyle}>This link is encoded in the QR code.</div>
            <div style={styles.digitalInfoTextStyle}>{qrSensitivityText}</div>
          </div>

          <div style={styles.qrPlaceholderStyle}>
            {qrDataUrl ? (
              <Image
                src={qrDataUrl}
                alt={`QR code for ${selectedName || "doll"}`}
                width={220}
                height={220}
                unoptimized
                sizes="220px"
                style={qrPreviewStyle}
              />
            ) : (
              <div>
                <div style={emptyStateTitleStyle}>No QR generated yet</div>
                <div style={emptyStateTextStyle}>
                  Generate a QR code and save it directly to this doll&apos;s digital identity.
                </div>
              </div>
            )}
          </div>

          <div style={styles.qrStatusBoxStyle(qrStatus)}>
            <div style={qrStatusTitleStyle}>
              {qrStatus === "saved"
                ? "QR saved successfully"
                : qrStatus === "generated"
                  ? "QR generated but not saved"
                  : "QR not generated yet"}
            </div>

            <div style={qrStatusTextStyle}>
              {qrStatus === "saved"
                ? "This QR is stored in Supabase and linked to this doll."
                : qrStatus === "generated"
                  ? "A fresh QR preview exists, but it could not be saved yet."
                  : "No QR has been generated for this doll yet."}
            </div>
          </div>

          <div style={actionRowStyle}>
            <button
              type="button"
              onClick={onPrepareDigitalIdentity}
              style={
                isGatewayEditable
                  ? styles.primaryButton
                  : styles.disabledActionStyle(styles.primaryButton)
              }
              disabled={!isGatewayEditable}
            >
              Prepare Digital Identity
            </button>

            <button
              type="button"
              onClick={savedQrUrl ? onRequestQrRegeneration : onGenerateQr}
              style={
                !isGatewayEditable
                  ? styles.disabledActionStyle(
                      savedQrUrl ? styles.secondaryButton : styles.primaryButton
                    )
                  : savedQrUrl
                    ? styles.secondaryButton
                    : styles.primaryButton
              }
              disabled={!isGatewayEditable || !publicUrl || qrUploading || !qrReady}
            >
              {qrUploading
                ? savedQrUrl
                  ? "Regenerating..."
                  : "Generating..."
                : savedQrUrl
                  ? "Regenerate QR"
                  : "Generate QR"}
            </button>

            <button
              type="button"
              onClick={onOpenPublicPage}
              style={styles.secondaryButton}
              disabled={!publicUrl}
            >
              Open Public Page
            </button>

            <button
              type="button"
              onClick={onCopyPublicUrl}
              style={styles.secondaryButton}
              disabled={!publicUrl}
            >
              Copy URL
            </button>

            <button
              type="button"
              onClick={onDownloadQr}
              style={styles.secondaryButton}
              disabled={!qrDataUrl}
            >
              Download QR
            </button>

            <button
              type="button"
              onClick={onDownloadPrintCard}
              style={styles.secondaryButton}
              disabled={!qrDataUrl}
            >
              Download Print Card
            </button>
          </div>

          {!qrReady ? (
            <div style={{ ...styles.hintStackStyle, marginTop: 12 }}>
              <div style={styles.operatorHintStyle("warn")}>{qrReadinessMessage}</div>
            </div>
          ) : null}

          {showQrRegenerateWarning ? (
            <div style={styles.qrWarningBoxStyle}>
              <div style={styles.qrWarningTitleStyle}>Regenerate QR Code?</div>
              <div style={styles.qrWarningTextStyle}>{qrWarningMessage}</div>
              <div style={warningActionRowStyle}>
                <button
                  type="button"
                  onClick={onCancelQrRegenerateWarning}
                  style={styles.secondaryButton}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onConfirmQrRegeneration}
                  style={
                    !isGatewayEditable
                      ? styles.disabledActionStyle(styles.dangerButton)
                      : styles.dangerButton
                  }
                  disabled={!isGatewayEditable || qrUploading}
                >
                  {qrUploading ? "Regenerating..." : "Regenerate anyway"}
                </button>
              </div>
            </div>
          ) : null}

          {qrDataUrl ? (
            <div style={styles.printCardWrapperStyle}>
              <div ref={printCardRef} style={styles.printCardStyle}>
                <div style={styles.printCardNameStyle}>{identityName || selectedName || "Doll"}</div>

                <div style={styles.printCardTextStyle}>Scan to discover her world</div>

                <Image
                  src={qrDataUrl}
                  alt={`Print card QR for ${identityName || selectedName || "doll"}`}
                  width={180}
                  height={180}
                  unoptimized
                  sizes="180px"
                  style={styles.printCardQrStyle}
                />

                <div style={styles.printCardBrandStyle}>Maille &amp; Merveille</div>
              </div>
            </div>
          ) : null}
        </div>

        <div style={styles.digitalCardStyle}>
          <div style={styles.sectionLabelStyle}>Visual Block</div>
          <div style={styles.visualPlaceholderStyle}>
            <div style={fullWidthStyle}>
              {identityImageUrl ? (
                <Image
                  src={identityImageUrl}
                  alt="Doll"
                  width={1200}
                  height={1200}
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 420px"
                  style={uploadedImageStyle}
                />
              ) : (
                <div>
                  <div style={emptyStateTitleStyle}>No image yet</div>
                  <div style={emptyStateTextStyle}>Upload a doll image</div>
                </div>
              )}

              {!hasImage ? (
                <div style={{ ...styles.hintStackStyle, marginTop: 12 }}>
                  <div style={styles.operatorHintStyle("muted")}>
                    Add a doll image to complete the public page.
                  </div>
                </div>
              ) : null}

              <input
                type="file"
                accept="image/*"
                style={fileInputStyle}
                disabled={!isGatewayEditable}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  await onUploadImage(file);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const panelStackStyle = {
  marginTop: 24,
  display: "grid",
  gap: 20,
};

const qrPreviewStyle = {
  width: 220,
  height: 220,
  display: "block",
  objectFit: "contain",
  borderRadius: 12,
};

const emptyStateTitleStyle = {
  fontWeight: 700,
  marginBottom: 6,
};

const emptyStateTextStyle = {
  fontSize: 14,
  color: "#64748b",
};

const qrStatusTitleStyle = {
  fontWeight: 700,
  marginBottom: 6,
};

const qrStatusTextStyle = {
  fontSize: 14,
  color: "#475569",
  lineHeight: 1.6,
};

const actionRowStyle = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 14,
};

const warningActionRowStyle = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 14,
};

const fullWidthStyle = {
  width: "100%",
};

const uploadedImageStyle = {
  width: "100%",
  height: "auto",
  display: "block",
  borderRadius: 16,
  objectFit: "cover",
  maxHeight: 260,
};

const fileInputStyle = {
  marginTop: 12,
};
