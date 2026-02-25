import { useQuery } from "@tanstack/react-query";
import { getAllEntities } from "../data";
import type { Entity, DomainKey } from "../types";

async function fetchEntities(domain?: DomainKey): Promise<Entity[]> {
  // Currently returns static data
  // Later: replace with TrustGraph API call
  const entities = getAllEntities();

  if (domain) {
    return entities.filter((e) => e.domain === domain);
  }

  return entities;
}

export function useEntities(domain?: DomainKey) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["entities", domain],
    queryFn: () => fetchEntities(domain),
    staleTime: Infinity,
  });

  return {
    entities: data ?? [],
    isLoading,
    isError,
    error,
  };
}
