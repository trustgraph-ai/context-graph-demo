import { useQuery } from "@tanstack/react-query";
import { DEMO_QUERIES } from "../data";
import type { DemoQuery } from "../types";

async function fetchDemoQueries(): Promise<DemoQuery[]> {
  // Currently returns static data
  // Later: replace with TrustGraph API call
  return DEMO_QUERIES;
}

export function useDemoQueries() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["demoQueries"],
    queryFn: fetchDemoQueries,
    staleTime: Infinity,
  });

  return {
    queries: data ?? [],
    isLoading,
    isError,
    error,
  };
}
