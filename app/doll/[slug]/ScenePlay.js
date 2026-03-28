"use client";

import { useState } from "react";

export default function ScenePlay({ scene }) {
  const activity = scene?.play_activity;
  const [selectedChoiceId, setSelectedChoiceId] = useState("");

  const selectedChoice =
    activity?.choices?.find((choice) => choice.id === selectedChoiceId) || null;

  return (
    <section style={sceneStyle}>
      <div style={panelStyle}>
        <div style={eyebrowStyle}>Play</div>
        <h2 style={titleStyle}>{activity?.prompt || "Choose a little adventure."}</h2>

        {activity?.helper_text ? (
          <p style={helperTextStyle}>{activity.helper_text}</p>
        ) : null}

        <div style={choiceGridStyle}>
          {(activity?.choices || []).map((choice) => (
            <button
              key={choice.id}
              type="button"
              onClick={() => setSelectedChoiceId(choice.id)}
              style={choiceButtonStyle(selectedChoiceId === choice.id)}
            >
              {choice.label}
            </button>
          ))}
        </div>

        <div style={resultCardStyle(Boolean(selectedChoice))}>
          {selectedChoice
            ? selectedChoice.result_text
            : "Pick one to see what happens next."}
        </div>
      </div>
    </section>
  );
}

const sceneStyle = {
  minHeight: "100svh",
  padding: "22px 18px 34px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(180deg, #ecfeff 0%, #e0f2fe 100%)",
};

const panelStyle = {
  width: "100%",
  maxWidth: 720,
  background: "rgba(255, 255, 255, 0.92)",
  border: "1px solid #bae6fd",
  borderRadius: 30,
  padding: 20,
  display: "grid",
  gap: 18,
  boxShadow: "0 24px 60px rgba(3, 105, 161, 0.12)",
};

const eyebrowStyle = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  color: "#0369a1",
  fontWeight: 700,
};

const titleStyle = {
  margin: 0,
  fontSize: "clamp(1.9rem, 6vw, 2.8rem)",
  lineHeight: 1.06,
  color: "#0f172a",
};

const helperTextStyle = {
  margin: 0,
  color: "#334155",
  lineHeight: 1.65,
  fontSize: "clamp(0.98rem, 3.6vw, 1.08rem)",
  maxWidth: 560,
};

const choiceGridStyle = {
  display: "grid",
  gap: 12,
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
};

function choiceButtonStyle(isActive) {
  return {
    border: isActive ? "2px solid #0284c7" : "1px solid #cbd5e1",
    background: isActive ? "#e0f2fe" : "#f8fafc",
    color: "#0f172a",
    padding: "18px 16px",
    borderRadius: 20,
    fontSize: 18,
    fontWeight: 700,
    cursor: "pointer",
    textAlign: "center",
    boxShadow: isActive ? "0 12px 28px rgba(14, 165, 233, 0.14)" : "none",
  };
}

function resultCardStyle(isActive) {
  return {
    minHeight: 110,
    borderRadius: 24,
    padding: 20,
    background: isActive ? "#ecfeff" : "#f8fafc",
    border: isActive ? "1px solid #67e8f9" : "1px solid #e2e8f0",
    color: "#164e63",
    fontSize: "clamp(1rem, 3.6vw, 1.08rem)",
    lineHeight: 1.7,
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    boxShadow: isActive ? "0 18px 34px rgba(34, 211, 238, 0.1)" : "none",
  };
}
