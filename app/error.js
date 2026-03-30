"use client";

export default function Error({ error, reset }) {
  console.error(error);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
        color: "#fff",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div>Something went wrong</div>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
