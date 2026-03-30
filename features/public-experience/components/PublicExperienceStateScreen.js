const stateShellStyle = {
  minHeight: "100svh",
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(180deg, #f8fafc 0%, #fffaf5 100%)",
  padding: 16,
};

const stateCardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 28,
  padding: 28,
  color: "#64748b",
  fontSize: 18,
  textAlign: "center",
};

const errorCardStyle = {
  background: "#ffffff",
  border: "1px solid #fecaca",
  borderRadius: 28,
  padding: 28,
  textAlign: "center",
  maxWidth: 480,
};

const errorTitleStyle = {
  margin: "0 0 12px",
  fontSize: 28,
  color: "#0f172a",
};

const errorTextStyle = {
  margin: 0,
  color: "#64748b",
  lineHeight: 1.8,
};

export default function PublicExperienceStateScreen({
  title = "",
  message,
  tone = "default",
}) {
  if (tone === "error") {
    return (
      <main style={stateShellStyle}>
        <div style={errorCardStyle}>
          <h1 style={errorTitleStyle}>{title || "Doll page unavailable"}</h1>
          <p style={errorTextStyle}>
            {message || "We could not load this doll page right now."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main style={stateShellStyle}>
      <div style={stateCardStyle}>{message}</div>
    </main>
  );
}
