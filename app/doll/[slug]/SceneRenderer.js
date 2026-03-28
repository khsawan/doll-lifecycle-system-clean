"use client";

import SceneWelcome from "./SceneWelcome";
import SceneStory from "./SceneStory";
import ScenePlay from "./ScenePlay";
import SceneMeetFriends from "./SceneMeetFriends";

export default function SceneRenderer({
  scene,
  experience,
  isActive,
  onStoryPageIndexChange,
}) {
  if (!scene) {
    return null;
  }

  if (scene.type === "welcome") {
    return <SceneWelcome universe={experience.universe} doll={experience.doll} />;
  }

  if (scene.type === "story") {
    return (
      <SceneStory
        doll={experience.doll}
        scene={scene}
        isActive={isActive}
        onPageIndexChange={onStoryPageIndexChange}
      />
    );
  }

  if (scene.type === "play") {
    return <ScenePlay scene={scene} />;
  }

  if (scene.type === "meet_friends") {
    return <SceneMeetFriends scene={scene} />;
  }

  return null;
}
