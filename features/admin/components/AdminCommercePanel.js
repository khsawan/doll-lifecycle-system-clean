"use client";

export function AdminCommercePanel({
  commerceStatus,
  onCommerceStatusChange,
  isGatewayEditable,
  commerceSaving,
  saveCommerceStatus,
  order,
  onOrderChange,
  saveOrder,
  styles,
}) {
  return (
    <div style={commercePanelStyle}>
      <div style={styles.contentCardStyle}>
        <div style={styles.sectionLabelStyle}>Product Commerce Status</div>
        <div style={commerceMetaStyle}>
          Controls whether this doll is sellable and counts toward Gateway readiness.
        </div>
        <select
          value={commerceStatus}
          onChange={(event) => onCommerceStatusChange(event.target.value)}
          style={
            isGatewayEditable && !commerceSaving
              ? styles.inputStyle
              : styles.disabledFormControlStyle(styles.inputStyle)
          }
          disabled={!isGatewayEditable || commerceSaving}
        >
          <option value="draft">Draft</option>
          <option value="ready_for_sale">Ready for Sale</option>
          <option value="unavailable">Unavailable</option>
        </select>
        <div style={styles.inlineValidationHintStyle}>
          Product Commerce Status controls sellability. Order Status tracks the customer/order
          lifecycle.
        </div>
        <div style={commerceActionRowStyle}>
          <button
            type="button"
            onClick={saveCommerceStatus}
            style={
              isGatewayEditable && !commerceSaving
                ? styles.primaryButton
                : styles.disabledActionStyle(styles.primaryButton)
            }
            disabled={!isGatewayEditable || commerceSaving}
          >
            {commerceSaving ? "Saving..." : "Save Product Commerce Status"}
          </button>
        </div>
      </div>

      <div style={styles.contentCardStyle}>
        <div style={styles.sectionLabelStyle}>Customer Name</div>
        <input
          value={order.customer_name}
          onChange={(event) =>
            onOrderChange({
              ...order,
              customer_name: event.target.value,
            })
          }
          style={styles.inputStyle}
        />
      </div>

      <div style={styles.contentCardStyle}>
        <div style={styles.sectionLabelStyle}>Contact Info</div>
        <input
          value={order.contact_info}
          onChange={(event) =>
            onOrderChange({
              ...order,
              contact_info: event.target.value,
            })
          }
          style={styles.inputStyle}
        />
      </div>

      <div style={styles.contentCardStyle}>
        <div style={styles.sectionLabelStyle}>Order Status</div>
        <select
          value={order.order_status}
          onChange={(event) =>
            onOrderChange({
              ...order,
              order_status: event.target.value,
            })
          }
          style={styles.inputStyle}
        >
          <option value="new">New</option>
          <option value="confirmed">Confirmed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
        </select>
        <div style={styles.inlineValidationHintStyle}>
          Tracks the customer/order lifecycle only. This does not control Gateway readiness.
        </div>
      </div>

      <div style={styles.contentCardStyle}>
        <div style={styles.sectionLabelStyle}>Notes</div>
        <textarea
          value={order.notes}
          onChange={(event) =>
            onOrderChange({
              ...order,
              notes: event.target.value,
            })
          }
          style={{ ...styles.inputStyle, minHeight: 120 }}
        />
      </div>

      <button type="button" onClick={saveOrder} style={styles.primaryButton}>
        Save Order
      </button>
    </div>
  );
}

const commercePanelStyle = {
  marginTop: 24,
  display: "grid",
  gap: 20,
};

const commerceMetaStyle = {
  color: "#64748b",
  fontSize: 15,
  marginTop: -2,
  marginBottom: 14,
};

const commerceActionRowStyle = {
  marginTop: 16,
};
