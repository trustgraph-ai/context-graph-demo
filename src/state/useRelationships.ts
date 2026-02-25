import { useQuery } from "@tanstack/react-query";
import { RELATIONSHIPS } from "../data";
import type { Relationship, DomainKey } from "../types";

interface RelationshipFilter {
  entityId?: string;
  domain?: DomainKey;
}

async function fetchRelationships(filter?: RelationshipFilter): Promise<Relationship[]> {
  // Currently returns static data
  // Later: replace with TrustGraph API call
  let relationships = [...RELATIONSHIPS];

  if (filter?.entityId) {
    relationships = relationships.filter(
      (r) => r.from === filter.entityId || r.to === filter.entityId
    );
  }

  if (filter?.domain) {
    relationships = relationships.filter((r) => r.domain.includes(filter.domain!));
  }

  return relationships;
}

export function useRelationships(filter?: RelationshipFilter) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["relationships", filter?.entityId, filter?.domain],
    queryFn: () => fetchRelationships(filter),
    staleTime: Infinity,
  });

  return {
    relationships: data ?? [],
    isLoading,
    isError,
    error,
  };
}
