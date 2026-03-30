"use client";

export function AdminCharacterPanel({
  isEditable,
  identity,
  setIdentity,
  themes,
  onSaveIdentity,
  styles,
}) {
  return (
    <div style={departmentStackStyle}>
      <fieldset
        disabled={!isEditable}
        style={{
          ...fieldsetStyle,
          opacity: isEditable ? 1 : 0.84,
        }}
      >
        <div style={identityGridStyle}>
          <div>
            <label style={styles.labelStyle}>Name</label>
            <input
              value={identity.name}
              onChange={(event) =>
                setIdentity({
                  ...identity,
                  name: event.target.value,
                })
              }
              style={styles.inputStyle}
            />
          </div>

          <div>
            <label style={styles.labelStyle}>Theme</label>
            <select
              value={identity.theme_name}
              onChange={(event) =>
                setIdentity({
                  ...identity,
                  theme_name: event.target.value,
                })
              }
              style={styles.inputStyle}
            >
              {themes.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.labelStyle}>Personality traits</label>
            <input
              value={identity.personality_traits}
              onChange={(event) =>
                setIdentity({
                  ...identity,
                  personality_traits: event.target.value,
                })
              }
              style={styles.inputStyle}
            />
          </div>

          <div>
            <label style={styles.labelStyle}>Emotional hook</label>
            <input
              value={identity.emotional_hook}
              onChange={(event) =>
                setIdentity({
                  ...identity,
                  emotional_hook: event.target.value,
                })
              }
              style={styles.inputStyle}
            />
          </div>

          <div>
            <label style={styles.labelStyle}>Expression Feel</label>
            <input
              value={identity.expression_feel}
              onChange={(event) =>
                setIdentity({
                  ...identity,
                  expression_feel: event.target.value,
                })
              }
              style={styles.inputStyle}
            />
          </div>
        </div>

        <div style={textSectionStyle}>
          <label style={styles.labelStyle}>Short intro</label>
          <textarea
            value={identity.short_intro}
            onChange={(event) =>
              setIdentity({
                ...identity,
                short_intro: event.target.value,
              })
            }
            style={textareaStyle(styles.inputStyle)}
          />
        </div>

        <div style={textSectionStyle}>
          <label style={styles.labelStyle}>Character World</label>
          <textarea
            value={identity.character_world}
            onChange={(event) =>
              setIdentity({
                ...identity,
                character_world: event.target.value,
              })
            }
            style={textareaStyle(styles.inputStyle)}
          />
        </div>

        <div style={saveRowStyle}>
          <button type="button" onClick={onSaveIdentity} style={styles.primaryButton}>
            Save Identity
          </button>
        </div>
      </fieldset>
    </div>
  );
}

const departmentStackStyle = {
  marginTop: 24,
  display: "grid",
  gap: 20,
};

const fieldsetStyle = {
  border: "none",
  padding: 0,
  margin: 0,
  minInlineSize: 0,
  display: "grid",
  gap: 16,
};

const identityGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
};

const textSectionStyle = {
  marginTop: 16,
};

function textareaStyle(inputStyle) {
  return {
    ...inputStyle,
    minHeight: 120,
    resize: "vertical",
  };
}

const saveRowStyle = {
  marginTop: 18,
};
