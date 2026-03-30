export function shouldPlayAmbientAudio({
  hasAudioRef = false,
  ambientAudioSrc = "",
  isAmbientAudioEnabled = false,
  shouldSuppressAmbientForVoice = false,
}) {
  return Boolean(
    hasAudioRef &&
      ambientAudioSrc &&
      isAmbientAudioEnabled &&
      !shouldSuppressAmbientForVoice
  );
}

export function shouldAutoplayStoryNarration({
  hasStoryAudioRef = false,
  isStoryScene = false,
  isContinuousStoryNarrationEnabled = false,
  isStoryPlaybackSessionActive = false,
  storyAudioSrc = "",
  storyPageIndex = 0,
  previousStoryPageIndex = 0,
}) {
  return Boolean(
    hasStoryAudioRef &&
      isStoryScene &&
      isContinuousStoryNarrationEnabled &&
      isStoryPlaybackSessionActive &&
      storyAudioSrc &&
      storyPageIndex !== previousStoryPageIndex
  );
}
