export default function OfflinePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "2rem",
        textAlign: "center",
        backgroundColor: "#0A0D0F",
        color: "#EDEEEC",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: "3rem",
          height: "3rem",
          borderRadius: "0.75rem",
          background: "linear-gradient(135deg, #34C495, #1F8F6B)",
        }}
        aria-hidden="true"
      />
      <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>You&apos;re offline</h1>
      <p style={{ color: "#8A9199", maxWidth: "22rem", margin: 0, lineHeight: 1.5 }}>
        Some information may be unavailable until your connection returns. Previously loaded
        screens and data should still work.
      </p>
    </main>
  );
}
