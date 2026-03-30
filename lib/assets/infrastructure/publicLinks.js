import { buildAdminPublicLinkState } from "../../../features/admin/domain/publicLinks";

export function buildAdminAssetPublicLinkContext(input = {}) {
  const state = buildAdminPublicLinkState(input);

  return {
    savedSlug: state.savedSlug,
    legacyLockedSlug: state.legacyLockedSlug,
    slugLocked: state.slugLocked,
    selectedSlug: state.selectedSlug,
    publicPath: state.publicPath,
    publicUrl: state.publicUrl,
    nextLockState: state.nextLockState,
  };
}
