import { describe, expect, it } from "vitest";
import { saveAdminContentPack } from "../../../../features/admin/services/contentAssets";
import { saveAdminOrder } from "../../../../features/admin/services/orders";
import { uploadAdminQrCode } from "../../../../features/admin/services/qr";
import { saveAdminStory } from "../../../../features/admin/services/stories";

function createWriteMockClient(resultsByTable = {}) {
  const operations = [];
  const storageResults = resultsByTable.storage || {};

  return {
    operations,
    from(tableName) {
      const result = resultsByTable[tableName] || {};

      return {
        delete() {
          operations.push({ type: "delete", tableName });

          return {
            eq(column, value) {
              operations.push({ type: "eq", tableName, column, value });
              const deleteResult = Promise.resolve(result.deleteResult || {});

              return {
                in(filterColumn, values) {
                  operations.push({
                    type: "in",
                    tableName,
                    filterColumn,
                    values,
                  });
                  return deleteResult;
                },
                then(resolve, reject) {
                  return deleteResult.then(resolve, reject);
                },
              };
            },
          };
        },
        insert(payload) {
          operations.push({ type: "insert", tableName, payload });
          return Promise.resolve(result.insertResult || {});
        },
        update(payload) {
          operations.push({ type: "update", tableName, payload });

          return {
            eq(column, value) {
              operations.push({ type: "eq", tableName, column, value });
              return Promise.resolve(result.updateResult || {});
            },
          };
        },
      };
    },
    storage: {
      from(bucketName) {
        return {
          upload(filePath, blob, options) {
            operations.push({ type: "upload", bucketName, filePath, blob, options });
            return Promise.resolve(storageResults.uploadResult || {});
          },
          getPublicUrl(filePath) {
            operations.push({ type: "getPublicUrl", bucketName, filePath });
            return storageResults.publicUrlResult || { data: { publicUrl: "" } };
          },
        };
      },
    },
  };
}

describe("admin write services", () => {
  it("saves story rows and updates the doll status", async () => {
    const client = createWriteMockClient();

    const result = await saveAdminStory(client, 7, {
      teaser: "Teaser",
      mainStory: "Main",
      mini1: "",
      mini2: "Mini 2",
    });

    expect(result.dollPatch).toEqual({ status: "story" });
    expect(result.rows).toHaveLength(3);
    expect(client.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "delete", tableName: "stories" }),
        expect.objectContaining({ type: "insert", tableName: "stories" }),
        expect.objectContaining({
          type: "update",
          tableName: "dolls",
          payload: { status: "story" },
        }),
      ])
    );
  });

  it("saves content-pack assets and updates the doll status", async () => {
    const client = createWriteMockClient();

    const result = await saveAdminContentPack(client, 9, {
      caption: "Caption",
      hook: "Hook",
      blurb: "Blurb",
      cta: "CTA",
    });

    expect(result.dollPatch).toEqual({ status: "content" });
    expect(result.rows).toHaveLength(4);
    expect(client.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "delete", tableName: "content_assets" }),
        expect.objectContaining({ type: "in", tableName: "content_assets" }),
        expect.objectContaining({ type: "insert", tableName: "content_assets" }),
      ])
    );
  });

  it("can save an order without advancing the doll to sales", async () => {
    const client = createWriteMockClient();

    const result = await saveAdminOrder(
      client,
      11,
      {
        customer_name: "Layla",
        contact_info: "layla@example.com",
        order_status: "reserved",
        notes: "VIP",
      },
      {
        persistSalesStatus: false,
        nextSalesStatus: "reserved",
      }
    );

    expect(result.dollPatch).toBeNull();
    expect(client.operations).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "update", tableName: "dolls" }),
      ])
    );
  });

  it("uploads a QR code and returns the cache-busted public URL", async () => {
    const client = createWriteMockClient({
      storage: {
        publicUrlResult: {
          data: {
            publicUrl: "https://cdn.example.com/qr-codes/rosie.png",
          },
        },
      },
    });

    const result = await uploadAdminQrCode(client, {
      dollId: 12,
      storageKey: "rosie",
      qrSource: "data:image/png;base64,abc",
      forceRefresh: true,
      fetcher: async () => ({
        blob: async () => "blob-data",
      }),
      now: () => 1234,
    });

    expect(result).toEqual({
      filePath: "qr-codes/rosie.png",
      publicQrUrl: "https://cdn.example.com/qr-codes/rosie.png",
      storedQrUrl: "https://cdn.example.com/qr-codes/rosie.png?v=1234",
    });
    expect(client.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "upload",
          bucketName: "doll-assets",
          filePath: "qr-codes/rosie.png",
        }),
        expect.objectContaining({
          type: "update",
          tableName: "dolls",
          payload: {
            qr_code_url: "https://cdn.example.com/qr-codes/rosie.png?v=1234",
          },
        }),
      ])
    );
  });
});
