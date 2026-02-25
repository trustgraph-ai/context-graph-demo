import { useQuery } from "@tanstack/react-query";
import { RELATIONSHIPS } from "../data";
import type { Relationship } from "../types";

interface EntityRelationships {
  incoming: Relationship[];
  outgoing: Relationship[];
}

async function fetchEntityRelationships(entityId: string): Promise<EntityRelationships> {
  // Currently returns static data
  // Later: replace with TrustGraph API call
  const incoming = RELATIONSHIPS.filter((r) => r.to === entityId);
  const outgoing = RELATIONSHIPS.filter((r) => r.from === entityId);

  return { incoming, outgoing };
}

export function useEntityRelationships(entityId: string | undefined) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["entityRelationships", entityId],
    queryFn: () => fetchEntityRelationships(entityId!),
    enabled: !!entityId,
    staleTime: Infinity,
  });

  return {
    incoming: data?.incoming ?? [],
    outgoing: data?.outgoing ?? [],
    isLoading,
    isError,
    error,
  };
}
