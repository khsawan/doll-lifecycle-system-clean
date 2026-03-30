"use client";

import { buildEditablePlayActivityState } from "../domain/content";

export function AdminGeneratedContentDraftEditor({
  generatedContentEditState,
  generatedContentSavingState,
  introScriptDraft,
  setIntroScriptDraft,
  selectedGeneratedV1Content,
  startIntroScriptEditing,
  cancelIntroScriptEditing,
  saveIntroScriptEdit,
  storyPageDrafts,
  setStoryPageDrafts,
  startStoryPageEditing,
  cancelStoryPageEditing,
  saveStoryPageEdit,
  playActivityDraft,
  setPlayActivityDraft,
  startPlayActivityEditing,
  cancelPlayActivityEditing,
  savePlayActivityEdit,
  selectedHasPlayActivityChoices,
  selectedEditablePlayActivity,
  styles,
}) {
  return (
    <div style={styles.sectionStyle}>
      <div style={styles.headerStyle}>
        <div>
          <div style={{ ...styles.sectionLabelStyle, marginBottom: 6 }}>Generated V1 Content</div>
          <div style={styles.titleStyle}>Controlled Editing</div>
        </div>
        <div style={styles.panelMetaStyle}>
          Operators can edit generated copy here. Save writes back to the same Supabase fields on
          this doll.
        </div>
      </div>

      <div style={styles.gridStyle}>
        <div style={styles.contentCardStyle}>
          <div style={styles.sectionHeaderStyle}>
            <label style={styles.labelStyle}>Intro Script</label>
            <div style={styles.sectionActionsStyle}>
              {generatedContentEditState.intro_script ? (
                <>
                  <button
                    type="button"
                    onClick={saveIntroScriptEdit}
                    style={styles.sectionButtonStyle(
                      "primary",
                      generatedContentSavingState.intro_script
                    )}
                    disabled={generatedContentSavingState.intro_script}
                  >
                    {generatedContentSavingState.intro_script ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelIntroScriptEditing}
                    style={styles.sectionButtonStyle(
                      "secondary",
                      generatedContentSavingState.intro_script
                    )}
                    disabled={generatedContentSavingState.intro_script}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={startIntroScriptEditing}
                  style={styles.sectionButtonStyle("secondary")}
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          <textarea
            value={
              generatedContentEditState.intro_script
                ? introScriptDraft
                : selectedGeneratedV1Content.intro_script
            }
            onChange={(event) => setIntroScriptDraft(event.target.value)}
            readOnly={!generatedContentEditState.intro_script}
            placeholder="Generate content to create the intro script."
            style={
              generatedContentEditState.intro_script
                ? { ...styles.inputStyle, minHeight: 120 }
                : { ...styles.readonlyFieldStyle, minHeight: 120 }
            }
          />
        </div>

        <div style={styles.storyGridStyle}>
          {selectedGeneratedV1Content.story_pages.map((page, index) => (
            <div key={`story-page-${index + 1}`} style={styles.contentCardStyle}>
              <div style={styles.sectionHeaderStyle}>
                <label style={styles.labelStyle}>Story Page {index + 1}</label>
                <div style={styles.sectionActionsStyle}>
                  {generatedContentEditState.story_pages[index] ? (
                    <>
                      <button
                        type="button"
                        onClick={() => saveStoryPageEdit(index)}
                        style={styles.sectionButtonStyle(
                          "primary",
                          generatedContentSavingState.story_pages[index]
                        )}
                        disabled={generatedContentSavingState.story_pages[index]}
                      >
                        {generatedContentSavingState.story_pages[index] ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => cancelStoryPageEditing(index)}
                        style={styles.sectionButtonStyle(
                          "secondary",
                          generatedContentSavingState.story_pages[index]
                        )}
                        disabled={generatedContentSavingState.story_pages[index]}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startStoryPageEditing(index)}
                      style={styles.sectionButtonStyle("secondary")}
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={generatedContentEditState.story_pages[index] ? storyPageDrafts[index] : page}
                onChange={(event) =>
                  setStoryPageDrafts((prev) =>
                    prev.map((value, pageIndex) =>
                      pageIndex === index ? event.target.value : value
                    )
                  )
                }
                readOnly={!generatedContentEditState.story_pages[index]}
                placeholder={`Generate content to create story page ${index + 1}.`}
                style={
                  generatedContentEditState.story_pages[index]
                    ? { ...styles.inputStyle, minHeight: 120 }
                    : { ...styles.readonlyFieldStyle, minHeight: 120 }
                }
              />
            </div>
          ))}
        </div>

        <div style={styles.contentCardStyle}>
          <div style={styles.sectionHeaderStyle}>
            <label style={styles.labelStyle}>Play Activity</label>
            <div style={styles.sectionActionsStyle}>
              {generatedContentEditState.play_activity ? (
                <>
                  <button
                    type="button"
                    onClick={savePlayActivityEdit}
                    style={styles.sectionButtonStyle(
                      "primary",
                      generatedContentSavingState.play_activity
                    )}
                    disabled={generatedContentSavingState.play_activity}
                  >
                    {generatedContentSavingState.play_activity ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelPlayActivityEditing}
                    style={styles.sectionButtonStyle(
                      "secondary",
                      generatedContentSavingState.play_activity
                    )}
                    disabled={generatedContentSavingState.play_activity}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={startPlayActivityEditing}
                  style={styles.sectionButtonStyle("secondary")}
                >
                  Edit
                </button>
              )}
            </div>
          </div>

          <div style={styles.fieldStackStyle}>
            <div>
              <label style={styles.labelStyle}>Prompt</label>
              <input
                value={
                  generatedContentEditState.play_activity
                    ? playActivityDraft.prompt
                    : selectedGeneratedV1Content.play_activity.prompt
                }
                onChange={(event) =>
                  setPlayActivityDraft((prev) => ({
                    ...prev,
                    prompt: event.target.value,
                  }))
                }
                readOnly={!generatedContentEditState.play_activity}
                placeholder="Generate content to create the play activity."
                style={
                  generatedContentEditState.play_activity
                    ? styles.inputStyle
                    : styles.readonlyFieldStyle
                }
              />
            </div>

            {generatedContentEditState.play_activity ? (
              <div style={styles.choiceListStyle}>
                {buildEditablePlayActivityState(playActivityDraft).choices.map((choice, index) => (
                  <div key={choice.id} style={styles.choiceEditorCardStyle}>
                    <div>
                      <label style={styles.labelStyle}>Choice {index + 1} Label</label>
                      <input
                        value={choice.label}
                        onChange={(event) =>
                          setPlayActivityDraft((prev) => ({
                            ...prev,
                            choices: buildEditablePlayActivityState(prev).choices.map(
                              (draftChoice, choiceIndex) =>
                                choiceIndex === index
                                  ? {
                                      ...draftChoice,
                                      label: event.target.value,
                                    }
                                  : draftChoice
                            ),
                          }))
                        }
                        style={styles.inputStyle}
                      />
                    </div>
                    <div>
                      <label style={styles.labelStyle}>Choice {index + 1} Result</label>
                      <textarea
                        value={choice.result_text}
                        onChange={(event) =>
                          setPlayActivityDraft((prev) => ({
                            ...prev,
                            choices: buildEditablePlayActivityState(prev).choices.map(
                              (draftChoice, choiceIndex) =>
                                choiceIndex === index
                                  ? {
                                      ...draftChoice,
                                      result_text: event.target.value,
                                    }
                                  : draftChoice
                            ),
                          }))
                        }
                        style={{ ...styles.inputStyle, minHeight: 100 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedHasPlayActivityChoices ? (
              <div style={styles.choiceListStyle}>
                {selectedEditablePlayActivity.choices.map((choice, index) => (
                  <div key={choice.id} style={styles.choiceCardStyle}>
                    <div style={styles.choiceLabelStyle}>
                      Choice {index + 1}: {choice.label || "Untitled"}
                    </div>
                    <div style={styles.choiceResultStyle}>{choice.result_text}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.inlineValidationHintStyle}>
                Generate content to create the play activity choices.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
