"use client";

import { useParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import PublicExperienceRouteView from "../../../features/public-experience/components/PublicExperienceRouteView";
import { usePublicExperiencePageController } from "../../../features/public-experience/hooks/usePublicExperiencePageController";
import V1ExperienceShell from "./V1ExperienceShell";

export default function DollPublicPage() {
  const params = useParams();
  const routeViewState = usePublicExperiencePageController({
    params,
    client: supabase,
  });

  return <PublicExperienceRouteView {...routeViewState} ExperienceShell={V1ExperienceShell} />;
}
