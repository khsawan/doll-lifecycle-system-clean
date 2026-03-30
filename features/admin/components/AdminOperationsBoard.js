"use client";

import {
  OPERATIONS_BOARD_FILTERS,
  OPERATIONS_BOARD_SORT_OPTIONS,
} from "../constants/workflow";
import { operationsWorkspaceButtonLabel } from "../domain/operations";
import { formatStatusToken } from "../domain/workflow";

export function AdminOperationsBoard({
  operationsFilter,
  operationsSort,
  onChangeFilter,
  onChangeSort,
  operationsSummaryItems,
  showPassiveOperationsResults,
  passiveOperationsTitle,
  passiveOperationsMeta,
  filteredOperationsByDoll,
  passiveEmptyStateText,
  showProductionQueue,
  productionQueueGroups,
  productionEmptyStateText,
  showContentQueue,
  contentQueueGroups,
  contentEmptyStateText,
  selectedId,
  onOpenWorkspace,
  styles,
}) {
  return (
    <section style={styles.boardStyle}>
      <div style={styles.boardHeaderStyle}>
        <div>
          <div style={{ ...styles.sectionLabelStyle, marginBottom: 6 }}>
            Multi-Doll Operations
          </div>
          <div style={styles.titleStyle}>Operations Board</div>
        </div>
        <div style={styles.boardMetaStyle}>
          A triage and routing layer that highlights dolls needing attention and routes the
          operator into the correct workspace.
        </div>
      </div>

      <div style={styles.controlsRowStyle}>
        <div style={styles.filterPillRowStyle}>
          {OPERATIONS_BOARD_FILTERS.map((filterOption) => (
            <button
              key={filterOption.value}
              type="button"
              onClick={() => onChangeFilter(filterOption.value)}
              style={styles.filterPillStyle(operationsFilter === filterOption.value)}
            >
              {filterOption.label}
            </button>
          ))}
        </div>

        <div style={styles.sortControlStyle}>
          <label style={styles.labelStyle}>Sort</label>
          <select
            value={operationsSort}
            onChange={(event) => onChangeSort(event.target.value)}
            style={{ ...styles.inputStyle, minWidth: 180, marginTop: 0 }}
          >
            {OPERATIONS_BOARD_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.summaryGridStyle}>
        {operationsSummaryItems.map((item) => (
          <div key={item.key} style={styles.summaryCardStyle}>
            <div style={styles.summaryLabelStyle}>{item.label}</div>
            <div style={styles.summaryValueStyle}>{item.value}</div>
          </div>
        ))}
      </div>

      {showPassiveOperationsResults ? (
        <div style={styles.queueColumnStyle}>
          <div style={styles.queueHeaderStyle}>
            <div style={styles.titleStyle}>{passiveOperationsTitle}</div>
            <div style={styles.queueMetaStyle}>{passiveOperationsMeta}</div>
          </div>

          {filteredOperationsByDoll.length ? (
            <div style={styles.cardListStyle}>
              {filteredOperationsByDoll.map((operation) => (
                <OperationsCard
                  key={operation.id || `${operation.internal_id}-${operation.name}`}
                  operation={operation}
                  selectedId={selectedId}
                  onOpenWorkspace={onOpenWorkspace}
                  styles={styles}
                />
              ))}
            </div>
          ) : (
            <div style={styles.emptyStateStyle}>{passiveEmptyStateText}</div>
          )}
        </div>
      ) : (
        <div style={styles.queueGridStyle}>
          {showProductionQueue ? (
            <OperationsQueueColumn
              title="Production Queue"
              meta="Dolls whose next action belongs in Production Pipeline."
              groups={productionQueueGroups}
              emptyStateText={productionEmptyStateText}
              selectedId={selectedId}
              onOpenWorkspace={onOpenWorkspace}
              styles={styles}
            />
          ) : null}

          {showContentQueue ? (
            <OperationsQueueColumn
              title="Content Queue"
              meta="Dolls whose next action belongs in Content Studio."
              groups={contentQueueGroups}
              emptyStateText={contentEmptyStateText}
              selectedId={selectedId}
              onOpenWorkspace={onOpenWorkspace}
              styles={styles}
            />
          ) : null}
        </div>
      )}
    </section>
  );
}

function OperationsQueueColumn({
  title,
  meta,
  groups,
  emptyStateText,
  selectedId,
  onOpenWorkspace,
  styles,
}) {
  return (
    <div style={styles.queueColumnStyle}>
      <div style={styles.queueHeaderStyle}>
        <div style={styles.titleStyle}>{title}</div>
        <div style={styles.queueMetaStyle}>{meta}</div>
      </div>

      {groups.length ? (
        groups.map((group) => (
          <div key={group.bucket} style={styles.bucketSectionStyle}>
            <div style={styles.bucketHeaderStyle}>
              <div style={styles.bucketTitleStyle}>{formatStatusToken(group.bucket)}</div>
              <div style={styles.bucketCountStyle}>{group.items.length}</div>
            </div>

            <div style={styles.cardListStyle}>
              {group.items.map((operation) => (
                <OperationsCard
                  key={operation.id}
                  operation={operation}
                  selectedId={selectedId}
                  onOpenWorkspace={onOpenWorkspace}
                  styles={styles}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div style={styles.emptyStateStyle}>{emptyStateText}</div>
      )}
    </div>
  );
}

function OperationsCard({ operation, selectedId, onOpenWorkspace, styles }) {
  return (
    <div style={styles.cardStyle(operation.urgency, selectedId === operation.id)}>
      <div style={styles.cardHeaderStyle}>
        <div>
          <div style={styles.cardNameStyle}>{operation.name}</div>
          <div style={styles.cardMetaStyle}>
            {operation.internal_id || "No ID"} - {operation.theme_name || "Unassigned"}
          </div>
        </div>
        <div style={styles.urgencyBadgeStyle(operation.urgency)}>
          {formatStatusToken(operation.urgency)}
        </div>
      </div>

      <div style={styles.badgeRowStyle}>
        <div style={styles.bucketBadgeStyle("production")}>
          {formatStatusToken(operation.production_bucket)}
        </div>
        <div style={styles.bucketBadgeStyle("content")}>
          {formatStatusToken(operation.content_bucket)}
        </div>
      </div>

      <div style={styles.actionLabelStyle}>Next Action</div>
      <div style={styles.actionTextStyle}>{operation.next_action}</div>
      <div style={styles.reasonTextStyle}>{operation.recommended_workspace_reason}</div>

      <div style={styles.cardActionRowStyle}>
        <button
          type="button"
          onClick={() => onOpenWorkspace(operation.id, operation.recommended_workspace)}
          style={styles.primaryButton}
        >
          {operationsWorkspaceButtonLabel(operation.recommended_workspace)}
        </button>
      </div>
    </div>
  );
}
