import PublicExperiencePageShell from "./PublicExperiencePageShell";
import PublicExperienceStateScreen from "./PublicExperienceStateScreen";

export default function PublicExperienceRouteView({
  loading,
  error,
  experience,
  ExperienceShell,
}) {
  if (loading) {
    return <PublicExperienceStateScreen message="Loading doll story..." />;
  }

  if (error || !experience) {
    return (
      <PublicExperienceStateScreen
        title="Doll page unavailable"
        message={error || "We could not load this doll page right now."}
        tone="error"
      />
    );
  }

  return (
    <PublicExperiencePageShell>
      <ExperienceShell experience={experience} />
    </PublicExperiencePageShell>
  );
}
