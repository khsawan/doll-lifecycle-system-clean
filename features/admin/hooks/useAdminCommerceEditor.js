"use client";

import { useState } from "react";
import { evaluateOrderSalesTransition } from "../domain/commerce";
import { normalizeCommerceStatus } from "../domain/content";
import { saveAdminDollPatchViaApi } from "../services/dollApi";
import { saveAdminOrderViaApi } from "../services/detailApi";

export function useAdminCommerceEditor({
  selected,
  selectedReadiness,
  effectiveSalesStatus,
  commerceStatus,
  order,
  saleTransitionReadinessMessage,
  setCommerceStatus,
  setDolls,
  setError,
  setNotice,
  fetcher = typeof fetch === "undefined" ? null : fetch,
}) {
  const [commerceSaving, setCommerceSaving] = useState(false);

  async function saveCommerceStatus() {
    if (!selected) return;

    setError("");
    setNotice("");
    setCommerceSaving(true);

    const nextCommerceStatus = normalizeCommerceStatus(commerceStatus);

    try {
      const { dollPatch } = await saveAdminDollPatchViaApi(fetcher, selected.id, {
        commerce_status: nextCommerceStatus,
      });

      setDolls((prev) =>
        prev.map((doll) =>
          doll.id === selected.id
            ? {
                ...doll,
                ...dollPatch,
              }
            : doll
        )
      );
      setCommerceStatus(dollPatch.commerce_status || nextCommerceStatus);
      setNotice("Product commerce status saved.");
    } catch (error) {
      setError(error.message);
    } finally {
      setCommerceSaving(false);
    }
  }

  async function saveOrder() {
    if (!selected) return;

    setError("");
    setNotice("");

    const { nextSalesStatus, blocked } = evaluateOrderSalesTransition({
      selectedReadinessOverall: selectedReadiness.overall,
      effectiveSalesStatus,
      selectedStatus: selected.status,
      orderStatus: order.order_status,
    });

    try {
      if (!fetcher) {
        throw new Error("Could not save order.");
      }

      const { dollPatch } = await saveAdminOrderViaApi(fetcher, selected.id, order, {
        persistSalesStatus: !blocked,
        nextSalesStatus,
      });

      if (blocked) {
        setError(`Order details saved, but ${saleTransitionReadinessMessage.toLowerCase()}`);
        return;
      }

      setDolls((prev) =>
        prev.map((doll) =>
          doll.id === selected.id
            ? {
                ...doll,
                ...dollPatch,
              }
            : doll
        )
      );

      setNotice("Order saved.");
    } catch (error) {
      setError(error.message);
    }
  }

  return {
    commerceSaving,
    setCommerceSaving,
    saveCommerceStatus,
    saveOrder,
  };
}
