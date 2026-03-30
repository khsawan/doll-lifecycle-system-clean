"use client";

const screenStyle = {
  background: "#f6f7fb",
  minHeight: "100vh",
  padding: 32,
  fontFamily: "Inter, Arial, sans-serif",
  color: "#0f172a",
};

const centeredLayoutStyle = {
  minHeight: "calc(100vh - 64px)",
  display: "grid",
  placeItems: "center",
};

const cardStyle = {
  width: "100%",
  maxWidth: 420,
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 28,
  padding: 28,
};

const brandStyle = {
  letterSpacing: 3,
  fontSize: 14,
  color: "#64748b",
  marginBottom: 8,
};

const checkingTextStyle = {
  fontSize: 16,
  color: "#475569",
  marginTop: 12,
  marginBottom: 0,
};

const loginIntroStyle = {
  fontSize: 16,
  color: "#475569",
  marginTop: 12,
};

const errorStyle = {
  marginTop: 16,
  background: "#fee2e2",
  border: "1px solid #fca5a5",
  color: "#991b1b",
  padding: 14,
  borderRadius: 16,
};

export function AdminAccessCheckingScreen() {
  return (
    <main style={screenStyle}>
      <div style={centeredLayoutStyle}>
        <div style={cardStyle}>
          <div style={brandStyle}>MAILLE & MERVEILLE</div>
          <h1 style={{ fontSize: 36, margin: 0, lineHeight: 1.08 }}>Doll Lifecycle System</h1>
          <p style={checkingTextStyle}>Checking admin access...</p>
        </div>
      </div>
    </main>
  );
}

export function AdminLoginScreen({
  loginError,
  loginPassword,
  onPasswordChange,
  onSubmit,
  labelStyle,
  inputStyle,
  primaryButton,
}) {
  return (
    <main style={screenStyle}>
      <div style={centeredLayoutStyle}>
        <div style={cardStyle}>
          <div style={brandStyle}>MAILLE & MERVEILLE</div>
          <h1 style={{ fontSize: 36, margin: 0, lineHeight: 1.08 }}>Admin Access</h1>
          <p style={loginIntroStyle}>Enter the admin password to continue.</p>

          {loginError ? <div style={errorStyle}>{loginError}</div> : null}

          <form onSubmit={onSubmit} style={{ marginTop: 20 }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={loginPassword}
              onChange={(event) => onPasswordChange(event.target.value)}
              style={inputStyle}
            />

            <button type="submit" style={{ ...primaryButton, width: "100%", marginTop: 16 }}>
              Enter
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
