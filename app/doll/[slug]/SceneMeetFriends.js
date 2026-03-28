"use client";

export default function SceneMeetFriends({ scene }) {
  const friends = scene?.related_characters || [];

  return (
    <section style={sceneStyle}>
      <div style={panelStyle}>
        <div style={eyebrowStyle}>Meet Friends</div>
        <h2 style={titleStyle}>Friends from the same little world</h2>

        <div style={cardGridStyle}>
          {friends.map((friend) => (
            <div key={friend.id || friend.slug || friend.name} style={cardStyle}>
              <div style={imageWrapStyle}>
                {friend.image_url ? (
                  <img
                    src={friend.image_url}
                    alt={friend.name || "Friend"}
                    style={imageStyle}
                  />
                ) : (
                  <div style={fallbackStyle}>{friend.name || "Friend"}</div>
                )}
              </div>
              <div style={nameStyle}>{friend.name || "Friend"}</div>
              <div style={introStyle}>{friend.short_intro || "A gentle little friend."}</div>
            </div>
          ))}
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
  background: "linear-gradient(180deg, #fdf4ff 0%, #fce7f3 100%)",
};

const panelStyle = {
  width: "100%",
  maxWidth: 760,
  background: "rgba(255, 255, 255, 0.92)",
  border: "1px solid #f5d0fe",
  borderRadius: 30,
  padding: 20,
  display: "grid",
  gap: 18,
  boxShadow: "0 24px 60px rgba(157, 23, 77, 0.12)",
};

const eyebrowStyle = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  color: "#be185d",
  fontWeight: 700,
};

const titleStyle = {
  margin: 0,
  fontSize: "clamp(1.9rem, 6vw, 2.8rem)",
  lineHeight: 1.06,
  color: "#831843",
};

const cardGridStyle = {
  display: "grid",
  gap: 14,
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
};

const cardStyle = {
  background: "#fffafc",
  border: "1px solid #fbcfe8",
  borderRadius: 24,
  padding: 16,
  display: "grid",
  gap: 12,
  textAlign: "center",
  boxShadow: "0 14px 32px rgba(190, 24, 93, 0.08)",
};

const imageWrapStyle = {
  width: "100%",
  borderRadius: 18,
  overflow: "hidden",
  background: "#ffffff",
  aspectRatio: "4 / 5",
};

const imageStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const fallbackStyle = {
  width: "100%",
  height: "100%",
  display: "grid",
  placeItems: "center",
  color: "#9d174d",
  fontWeight: 700,
  padding: 12,
};

const nameStyle = {
  fontWeight: 700,
  color: "#831843",
  fontSize: 20,
};

const introStyle = {
  color: "#9d174d",
  lineHeight: 1.6,
  fontSize: 14,
};
