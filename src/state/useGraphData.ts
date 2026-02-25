import { useQuery } from "@tanstack/react-query";
import { getAllEntities, RELATIONSHIPS } from "../data";
import type { Entity, Relationship, DomainKey } from "../types";

interface GraphData {
  entities: Entity[];
  relationships: Relationship[];
}

async function fetchGraphData(domain?: DomainKey): Promise<GraphData> {
  // Currently returns static data
  // Later: replace with TrustGraph API call
  let entities = getAllEntities();
  let relationships = [...RELATIONSHIPS];

  if (domain) {
    entities = entities.filter((e) => e.domain === domain);
    const entityIds = new Set(entities.map((e) => e.id));
    relationships = relationships.filter(
      (r) => entityIds.has(r.from) || entityIds.has(r.to)
    );
  }

  return { entities, relationships };
}

export function useGraphData(domain?: DomainKey) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["graphData", domain],
    queryFn: () => fetchGraphData(domain),
    staleTime: Infinity,
  });

  return {
    entities: data?.entities ?? [],
    relationships: data?.relationships ?? [],
    isLoading,
    isError,
    error,
  };
}
