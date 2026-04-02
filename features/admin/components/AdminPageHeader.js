"use client";

import Link from "next/link";

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  gap: 16,
  flexWrap: "wrap",
};

const brandStyle = {
  letterSpacing: 3,
  fontSize: 14,
  color: "#64748b",
  marginBottom: 8,
};

const actionRowStyle = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
};

const subtitleStyle = {
  fontSize: 18,
  color: "#475569",
  maxWidth: 860,
  marginTop: 12,
};

export function AdminPageHeader({ adminProtectionEnabled, onLogout, onBlueprint, secondaryButton }) {
  return (
    <>
      <div style={rowStyle}>
        <div>
          <div style={brandStyle}>MAILLE & MERVEILLE</div>

          <h1 style={{ fontSize: 50, margin: 0, lineHeight: 1.05 }}>Doll Lifecycle System</h1>
        </div>

        <div style={actionRowStyle}>
          <Link
            href="/settings"
            style={{
              ...secondaryButton,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            Settings
          </Link>
          <button onClick={onBlueprint} style={secondaryButton}>
            Blueprint
          </button>
          {adminProtectionEnabled ? (
            <button onClick={onLogout} style={secondaryButton}>
              Logout
            </button>
          ) : null}
        </div>
      </div>

      <p style={subtitleStyle}>
        A full internal pipeline that transforms every handmade doll into a character, a living
        digital story asset, and a scalable brand node.
      </p>
    </>
  );
}
