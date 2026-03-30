export function applyPipelineCommandToRecords(
  records = [],
  { dollId, pipelineState, persisted = false, syncRecord } = {}
) {
  const list = Array.isArray(records) ? records : [];

  return list.map((record) => {
    if (record?.id !== dollId) {
      return record;
    }

    if (typeof syncRecord !== "function") {
      return record;
    }

    return syncRecord(record, pipelineState, {
      persisted,
    });
  });
}
