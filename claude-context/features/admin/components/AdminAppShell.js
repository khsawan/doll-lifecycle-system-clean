"use client";

export function AdminAppShell({
  header,
  operationsBoard,
  navigator,
  workspacePanel,
  modal,
}) {
  return (
    <main style={mainStyle}>
      <div style={innerStyle}>
        {header}
        {operationsBoard}

        <div style={workspaceGridStyle}>
          {navigator}
          {workspacePanel}
        </div>

        {modal}
      </div>

      <style jsx>{`
        .doll-identity-card:hover {
          box-shadow: none !important;
        }

        .admin-variation-card {
          transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease,
            background-color 160ms ease;
        }

        .admin-variation-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
        }

        .admin-variation-card.is-selected {
          box-shadow: 0 16px 30px rgba(34, 197, 94, 0.12);
        }

        .admin-variation-card.is-selected:hover {
          transform: translateY(-1px);
        }

        .admin-variation-button {
          transition: transform 140ms ease, box-shadow 140ms ease, background-color 140ms ease,
            color 140ms ease;
        }

        .admin-variation-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 18px rgba(15, 23, 42, 0.08);
        }

        .admin-variation-button:focus-visible {
          outline: 2px solid #166534;
          outline-offset: 2px;
        }

        .admin-variation-preview {
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 5;
          overflow: hidden;
          white-space: normal !important;
        }

        .pipeline-stage-grid {
          width: 100%;
        }

        @media (max-width: 900px) {
          .doll-identity-meta-strip {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 640px) {
          .doll-identity-meta-strip {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 1180px) {
          .pipeline-stage-grid {
            grid-template-columns: repeat(auto-fit, minmax(148px, 1fr)) !important;
          }
        }

        @media (max-width: 840px) {
          .pipeline-stage-grid {
            grid-template-columns: repeat(auto-fit, minmax(132px, 1fr)) !important;
          }
        }
      `}</style>
    </main>
  );
}

const mainStyle = {
  background: "#f6f7fb",
  minHeight: "100vh",
  padding: 32,
  fontFamily: "Inter, Arial, sans-serif",
  color: "#0f172a",
};

const innerStyle = {
  maxWidth: 1320,
  margin: "0 auto",
};

const workspaceGridStyle = {
  display: "grid",
  gridTemplateColumns: "320px minmax(0, 1fr)",
  gap: 24,
  marginTop: 28,
};
