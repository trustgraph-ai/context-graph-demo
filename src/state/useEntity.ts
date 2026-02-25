import { useQuery } from "@tanstack/react-query";
import { getAllEntities } from "../data";
import type { Entity } from "../types";

async function fetchEntity(id: string): Promise<Entity | null> {
  // Currently returns static data
  // Later: replace with TrustGraph API call
  const entities = getAllEntities();
  return entities.find((e) => e.id === id) ?? null;
}

export function useEntity(id: string | undefined) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["entity", id],
    queryFn: () => fetchEntity(id!),
    enabled: !!id,
    staleTime: Infinity,
  });

  return {
    entity: data ?? null,
    isLoading,
    isError,
    error,
  };
}
