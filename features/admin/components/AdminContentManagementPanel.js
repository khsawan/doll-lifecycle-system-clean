"use client";

export function AdminContentManagementPanel({
  contentOverviewItems,
  contentAssetCompleteness,
  managedContentGenerating,
  contentPreviewHref,
  selectedContentManagement,
  contentManagementNextStepGuidance,
  onGenerateManagedContent,
  onPreviewManagedContent,
  onApproveManagedContent,
  onPublishManagedContent,
  onUnpublishManagedContent,
  styles,
}) {
  return (
    <div style={styles.workspaceStyle}>
      <div style={styles.panelStyle}>
        <div style={styles.panelHeaderStyle}>
          <div>
            <div style={{ ...styles.sectionLabelStyle, marginBottom: 6 }}>Content Management</div>
            <div style={styles.titleStyle}>Content Overview</div>
          </div>
          <div style={styles.panelMetaStyle}>
            This layer supports content work without changing the production pipeline.
          </div>
        </div>

        <div style={styles.overviewGridStyle}>
          {contentOverviewItems.map((item) => (
            <div
              key={item.key}
              style={styles.metricCardStyle(item.tone, item.key === "asset_completeness")}
            >
              <div style={styles.metricLabelStyle(item.tone)}>{item.label}</div>
              <div style={styles.metricValueStyle}>{item.value}</div>
              <div style={styles.metricMetaTextStyle}>{item.meta}</div>
              {item.key === "asset_completeness" ? (
                <div style={styles.assetListStyle}>
                  {contentAssetCompleteness.items.map((asset) => (
                    <div key={asset.key} style={styles.assetBadgeStyle(asset.complete)}>
                      {asset.label}: {asset.complete ? "Yes" : "No"}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.panelStyle}>
        <div>
          <div style={{ ...styles.sectionLabelStyle, marginBottom: 6 }}>Content Production</div>
          <div style={styles.titleStyle}>Content Actions</div>
        </div>

        <div style={styles.actionGridStyle}>
          <button
            type="button"
            onClick={onGenerateManagedContent}
            style={styles.actionButtonStyle("primary", managedContentGenerating)}
            disabled={managedContentGenerating}
          >
            {managedContentGenerating ? "Generating..." : "Generate Content"}
          </button>
          <button
            type="button"
            onClick={onPreviewManagedContent}
            style={styles.actionButtonStyle("secondary", !contentPreviewHref)}
            disabled={!contentPreviewHref}
          >
            Preview
          </button>
          <button
            type="button"
            onClick={onApproveManagedContent}
            style={styles.actionButtonStyle(
              "secondary",
              selectedContentManagement.generation_status !== "generated"
            )}
            disabled={selectedContentManagement.generation_status !== "generated"}
          >
            Approve
          </button>
          <button
            type="button"
            onClick={onPublishManagedContent}
            style={styles.actionButtonStyle(
              "primary",
              selectedContentManagement.review_status !== "approved"
            )}
            disabled={selectedContentManagement.review_status !== "approved"}
          >
            Publish
          </button>
          <button
            type="button"
            onClick={onUnpublishManagedContent}
            style={styles.actionButtonStyle(
              "secondary",
              selectedContentManagement.publish_status !== "live"
            )}
            disabled={selectedContentManagement.publish_status !== "live"}
          >
            Unpublish
          </button>
        </div>

        {contentManagementNextStepGuidance ? (
          <div style={styles.guidanceStyle}>
            <div style={styles.guidanceLabelStyle}>Next Step</div>
            <div style={styles.guidanceTextStyle}>{contentManagementNextStepGuidance}</div>
          </div>
        ) : null}

        <div style={styles.operatorHintStyle("muted")}>
          Generated content can be reviewed and edited here without changing pipeline stage
          state, QR behavior, commerce status, or CRM/order flow.
        </div>
      </div>
    </div>
  );
}
