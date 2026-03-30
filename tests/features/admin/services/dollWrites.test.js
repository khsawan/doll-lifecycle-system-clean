import { describe, expect, it } from "vitest";
import {
  createAdminDoll,
  deleteAdminDollPermanently,
  persistAdminPipelineState,
  uploadAdminDollImage,
} from "../../../../features/admin/services/dolls";

function createDollWriteClient(config = {}) {
  const operations = [];
  const insertCounts = {};
  const updateCounts = {};
  const storageConfig = config.storage || {};

  function resolveTableConfig(tableName) {
    return config[tableName] || {};
  }

  function nextSequenceValue(sequence, index, fallbackValue) {
    if (!Array.isArray(sequence) || sequence.length === 0) {
      return fallbackValue;
    }

    return sequence[Math.min(index, sequence.length - 1)];
  }

  return {
    operations,
    from(tableName) {
      const tableConfig = resolveTableConfig(tableName);

      return {
        insert(payload) {
          operations.push({ type: "insert", tableName, payload });
          const insertIndex = insertCounts[tableName] || 0;
          insertCounts[tableName] = insertIndex + 1;
          const insertResult = nextSequenceValue(
            tableConfig.insertResults,
            insertIndex,
            tableConfig.insertResult || {}
          );

          return {
            select() {
              return {
                single() {
                  return Promise.resolve(insertResult);
                },
              };
            },
          };
        },
        update(payload) {
          operations.push({ type: "update", tableName, payload });

          return {
            eq(column, value) {
              operations.push({ type: "eq", tableName, column, value });
              const updateIndex = updateCounts[tableName] || 0;
              updateCounts[tableName] = updateIndex + 1;
              const updateResult = nextSequenceValue(
                tableConfig.updateResults,
                updateIndex,
                tableConfig.updateResult || {}
              );

              return Promise.resolve(updateResult);
            },
          };
        },
        delete() {
          operations.push({ type: "delete", tableName });

          return {
            eq(column, value) {
              operations.push({ type: "eq", tableName, column, value });
              return Promise.resolve(tableConfig.deleteResult || {});
            },
          };
        },
      };
    },
    storage: {
      from(bucketName) {
        return {
          remove(paths) {
            operations.push({ type: "remove", bucketName, paths });
            return Promise.resolve(storageConfig.removeResult || {});
          },
          upload(filePath, file, options) {
            operations.push({ type: "upload", bucketName, filePath, file, options });
            return Promise.resolve(storageConfig.uploadResult || {});
          },
          getPublicUrl(filePath) {
            operations.push({ type: "getPublicUrl", bucketName, filePath });
            return storageConfig.publicUrlResult || { data: { publicUrl: "" } };
          },
        };
      },
    },
  };
}

describe("admin doll write services", () => {
  it("creates a doll and falls back when the pipeline_state column is unavailable", async () => {
    const client = createDollWriteClient({
      dolls: {
        insertResults: [
          {
            data: null,
            error: { message: "Could not find the pipeline_state column in the schema cache" },
          },
          {
            data: {
              id: 5,
              name: "Rosie",
              theme_name: "",
              created_at: "2026-03-28T10:00:00.000Z",
              pipeline_state: null,
            },
            error: null,
          },
        ],
      },
    });

    const nextDoll = await createAdminDoll(client, {
      basePayload: {
        internal_id: "DOLL-001",
        name: "Rosie",
        theme_name: "",
      },
      defaultPipelineState: {
        registered: { status: "open" },
      },
      pipelineTimestamp: "2026-03-28T10:00:00.000Z",
    });

    expect(nextDoll.theme_name).toBe("Unassigned");
    expect(nextDoll.pipelineState.registered.status).toBe("open");
    expect(
      client.operations.filter(
        (operation) => operation.type === "insert" && operation.tableName === "dolls"
      )
    ).toHaveLength(2);
  });

  it("treats missing pipeline-state column support as a local-only persistence result", async () => {
    const client = createDollWriteClient({
      dolls: {
        updateResult: {
          error: { message: "column pipeline_state does not exist" },
        },
      },
    });

    const result = await persistAdminPipelineState(client, 9, {
      registered: { status: "completed" },
    });

    expect(result).toEqual({
      persisted: false,
      pipelineState: {
        registered: { status: "completed" },
      },
    });
  });

  it("uploads a doll image and stores the public URL on the doll record", async () => {
    const client = createDollWriteClient({
      storage: {
        publicUrlResult: {
          data: {
            publicUrl: "https://cdn.example.com/dolls/7-1234-rosie.png",
          },
        },
      },
    });

    const result = await uploadAdminDollImage(client, {
      dollId: 7,
      file: { name: "rosie.png" },
      now: () => 1234,
    });

    expect(result).toEqual({
      filePath: "dolls/7-1234-rosie.png",
      publicImageUrl: "https://cdn.example.com/dolls/7-1234-rosie.png",
    });
    expect(client.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "upload",
          bucketName: "doll-assets",
          filePath: "dolls/7-1234-rosie.png",
        }),
        expect.objectContaining({
          type: "update",
          tableName: "dolls",
          payload: {
            image_url: "https://cdn.example.com/dolls/7-1234-rosie.png",
          },
        }),
      ])
    );
  });

  it("removes related records and stored assets when permanently deleting a doll", async () => {
    const client = createDollWriteClient();

    const result = await deleteAdminDollPermanently(client, {
      dollId: 13,
      storagePaths: ["qr-codes/rosie.png", "qr-codes/rosie.png", "dolls/rosie.png"],
    });

    expect(result).toEqual({
      deletedId: 13,
      storagePaths: ["qr-codes/rosie.png", "dolls/rosie.png"],
    });
    expect(client.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "remove",
          bucketName: "doll-assets",
          paths: ["qr-codes/rosie.png", "dolls/rosie.png"],
        }),
        expect.objectContaining({ type: "delete", tableName: "stories" }),
        expect.objectContaining({ type: "delete", tableName: "content_assets" }),
        expect.objectContaining({ type: "delete", tableName: "orders" }),
        expect.objectContaining({ type: "delete", tableName: "dolls" }),
      ])
    );
  });
});
