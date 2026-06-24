import type { Metadata } from "next";
import { listFields, listFilterOptions, listExperts } from "@/lib/brahmbook.functions";
import { ExpertsListClient } from "./experts-list";

export const metadata: Metadata = {
  title: "Browse Community Experts — BrahmBook",
  description:
    "Search and filter BrahmBook's directory of volunteer community experts by location, field, and education.",
  openGraph: {
    title: "Browse Community Experts — BrahmBook",
    description: "Find someone in the community who can help.",
  },
};

export const revalidate = 30; // Revalidate experts directory view every 30 seconds

export default async function ExpertsPage() {
  let fields: { id: string; name: string }[] = [];
  let opts = { cities: [], states: [], educations: [] };
  let initialExpertsResult = { experts: [] };

  try {
    const [fieldsData, optsData, expertsData] = await Promise.all([
      listFields(),
      listFilterOptions(),
      listExperts({ data: {} }),
    ]);
    fields = fieldsData;
    opts = optsData as any;
    initialExpertsResult = expertsData as any;
  } catch (error) {
    console.error("Failed to load experts directory page data:", error);
  }

  return (
    <ExpertsListClient fields={fields} opts={opts} initialExperts={initialExpertsResult.experts} />
  );
}
