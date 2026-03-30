export async function saveAdminOrder(
  client,
  dollId,
  order = {},
  { persistSalesStatus = true, nextSalesStatus = "reserved" } = {}
) {
  if (!client) {
    throw new Error("Supabase environment variables are missing.");
  }

  if (!dollId) {
    throw new Error("A doll id is required.");
  }

  const deleteResult = await client.from("orders").delete().eq("doll_id", dollId);
  if (deleteResult?.error) {
    throw deleteResult.error;
  }

  const orderRow = {
    doll_id: dollId,
    customer_name: order.customer_name,
    contact_info: order.contact_info,
    order_status: order.order_status,
    notes: order.notes,
  };

  const insertResult = await client.from("orders").insert(orderRow);
  if (insertResult?.error) {
    throw insertResult.error;
  }

  if (!persistSalesStatus) {
    return {
      orderRow,
      dollPatch: null,
    };
  }

  const dollPatch = {
    sales_status: nextSalesStatus,
    status: "sales",
  };
  const updateResult = await client.from("dolls").update(dollPatch).eq("id", dollId);
  if (updateResult?.error) {
    throw updateResult.error;
  }

  return {
    orderRow,
    dollPatch,
  };
}
