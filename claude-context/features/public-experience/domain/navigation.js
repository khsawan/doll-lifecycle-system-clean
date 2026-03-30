export function clampSceneIndex(sceneIndex, sceneCount) {
  const normalizedIndex = Number.isFinite(sceneIndex) ? sceneIndex : 0;

  if (!Number.isFinite(sceneCount) || sceneCount <= 0) {
    return 0;
  }

  return Math.min(Math.max(0, normalizedIndex), sceneCount - 1);
}

export function canRequestSceneChange({
  isTransitioning = false,
  nextIndex,
  sceneCount = 0,
  sceneIndex = 0,
}) {
  if (isTransitioning) {
    return false;
  }

  if (!Number.isFinite(nextIndex) || !Number.isFinite(sceneCount)) {
    return false;
  }

  if (sceneCount <= 0) {
    return false;
  }

  if (nextIndex < 0 || nextIndex > sceneCount - 1) {
    return false;
  }

  return nextIndex !== sceneIndex;
}
