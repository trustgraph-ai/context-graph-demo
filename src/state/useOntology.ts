import { useQuery } from "@tanstack/react-query";
import { ONTOLOGY } from "../data";
import type { OntologyType } from "../types";

async function fetchOntology(): Promise<OntologyType> {
  // Currently returns static data
  // Later: replace with TrustGraph API call
  return ONTOLOGY;
}

export function useOntology() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["ontology"],
    queryFn: fetchOntology,
    staleTime: Infinity,
  });

  return {
    ontology: data,
    isLoading,
    isError,
    error,
  };
}
