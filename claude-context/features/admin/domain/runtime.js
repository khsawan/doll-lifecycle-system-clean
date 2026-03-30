export function resolvePublicBaseUrl({ siteUrl = "", origin = "" } = {}) {
  const normalizedSiteUrl = typeof siteUrl === "string" ? siteUrl.trim() : "";
  if (normalizedSiteUrl) {
    return normalizedSiteUrl.replace(/\/+$/, "");
  }

  const normalizedOrigin = typeof origin === "string" ? origin.trim() : "";
  return normalizedOrigin || "";
}

export function buildAdminVersionInfo({
  sha = "",
  message = "",
  env = "",
} = {}) {
  const normalizedSha = typeof sha === "string" && sha.trim() ? sha.trim() : "unknown";
  const normalizedMessage =
    typeof message === "string" && message.trim() ? message.trim() : "unknown";
  const normalizedEnv = typeof env === "string" && env.trim() ? env.trim() : "unknown";
  const shortSha = normalizedSha === "unknown" ? "unknown" : normalizedSha.slice(0, 7);
  const envLabel = normalizedEnv.charAt(0).toUpperCase() + normalizedEnv.slice(1);

  return {
    sha: shortSha,
    message: normalizedMessage,
    env: envLabel,
    label: `v${shortSha} | ${envLabel} | ${normalizedMessage}`,
  };
}
