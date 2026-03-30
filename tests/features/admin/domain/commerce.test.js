import { describe, expect, it } from "vitest";
import {
  evaluateOrderSalesTransition,
  getNextSalesStatusFromOrder,
} from "../../../../features/admin/domain/commerce";

describe("admin commerce domain helpers", () => {
  it("maps delivered orders to sold status and all other states to reserved", () => {
    expect(getNextSalesStatusFromOrder("delivered")).toBe("sold");
    expect(getNextSalesStatusFromOrder("confirmed")).toBe("reserved");
    expect(getNextSalesStatusFromOrder("")).toBe("reserved");
  });

  it("flags blocked sales transitions when readiness is incomplete and the doll would advance", () => {
    expect(
      evaluateOrderSalesTransition({
        selectedReadinessOverall: false,
        effectiveSalesStatus: "not_sold",
        selectedStatus: "content",
        orderStatus: "confirmed",
      })
    ).toEqual({
      nextSalesStatus: "reserved",
      blocked: true,
    });

    expect(
      evaluateOrderSalesTransition({
        selectedReadinessOverall: true,
        effectiveSalesStatus: "not_sold",
        selectedStatus: "content",
        orderStatus: "delivered",
      })
    ).toEqual({
      nextSalesStatus: "sold",
      blocked: false,
    });
  });
});
