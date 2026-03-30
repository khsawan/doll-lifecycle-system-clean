export function getNextSalesStatusFromOrder(orderStatus) {
  const normalized = typeof orderStatus === "string" ? orderStatus.trim().toLowerCase() : "";
  return normalized === "delivered" ? "sold" : "reserved";
}

export function evaluateOrderSalesTransition({
  selectedReadinessOverall,
  effectiveSalesStatus,
  selectedStatus,
  orderStatus,
}) {
  const nextSalesStatus = getNextSalesStatusFromOrder(orderStatus);
  const blocked =
    !selectedReadinessOverall &&
    (nextSalesStatus !== effectiveSalesStatus || selectedStatus !== "sales");

  return {
    nextSalesStatus,
    blocked,
  };
}
