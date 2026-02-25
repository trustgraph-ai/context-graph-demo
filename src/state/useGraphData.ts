import { useMemo } from "react";
import { useTriples } from "@trustgraph/react-state";
import type { Entity, Relationship, DomainKey } from "../types";

// TrustGraph constants
const COLLECTION = "retail";
const NS = "http://trustgraph.ai/retail#";
const RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
const RDFS_LABEL = "http://www.w3.org/2000/01/rdf-schema#label";

// Domain configuration
const DOMAIN_CONFIG: Record<string, { domain: DomainKey; color: string; glow: string; icon: string }> = {
  [`${NS}Consumer`]: { domain: "consumer", color: "#6EE7B7", glow: "rgba(110,231,183,0.4)", icon: "👤" },
  [`${NS}Brand`]: { domain: "brand", color: "#F9A8D4", glow: "rgba(249,168,212,0.4)", icon: "✦" },
  [`${NS}Retail`]: { domain: "retail", color: "#93C5FD", glow: "rgba(147,197,253,0.4)", icon: "🏬" },
  [`${NS}Agent`]: { domain: "agent", color: "#FCD34D", glow: "rgba(252,211,77,0.4)", icon: "⚡" },
};

// Known object properties (relationships)
const OBJECT_PROPERTIES = new Set([
  `${NS}hasAffinityFor`, `${NS}frequents`, `${NS}purchasesFrom`, `${NS}advocatesFor`, `${NS}loyalTo`,
  `${NS}shopsVia`, `${NS}discoversThrough`, `${NS}experiences`, `${NS}memberOf`,
  `${NS}merchandisesIn`, `${NS}activatesVia`, `${NS}promotesOn`, `${NS}sellsThrough`, `${NS}rewardsVia`,
  `${NS}recommendsTo`, `${NS}personalizesFor`, `${NS}monitorsSentimentOf`, `${NS}optimizesJourneyFor`,
  `${NS}orchestratesCampaignFor`, `${NS}analyzesPerceptionOf`, `${NS}curatesProductsFor`,
  `${NS}tailorsExperienceAt`, `${NS}deploysCampaignAt`, `${NS}optimizesFlowAt`,
]);

// Helper to extract value from a Term
function getTermValue(term: { t: string; i?: string; v?: string }): string {
  if (term.t === "i") return term.i || "";
  if (term.t === "l") return term.v || "";
  return "";
}

// Helper to create a short ID from a URI
function uriToId(uri: string): string {
  const parts = uri.split("/");
  return parts[parts.length - 1];
}

// Helper to extract predicate name from URI
function predicateToName(uri: string): string {
  const name = uri.replace(NS, "");
  return name.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
}

// Helper to determine domain from URI
function uriToDomain(uri: string): DomainKey {
  if (uri.includes("consumer")) return "consumer";
  if (uri.includes("brand")) return "brand";
  if (uri.includes("retail")) return "retail";
  if (uri.includes("agent")) return "agent";
  return "consumer";
}

export function useGraphData(domain?: DomainKey) {
  // Query for entities of each type
  const consumerTypes = useTriples({
    p: { t: "i", i: RDF_TYPE },
    o: { t: "i", i: `${NS}Consumer` },
    limit: 100,
    collection: COLLECTION,
  });

  const brandTypes = useTriples({
    p: { t: "i", i: RDF_TYPE },
    o: { t: "i", i: `${NS}Brand` },
    limit: 100,
    collection: COLLECTION,
  });

  const retailTypes = useTriples({
    p: { t: "i", i: RDF_TYPE },
    o: { t: "i", i: `${NS}Retail` },
    limit: 100,
    collection: COLLECTION,
  });

  const agentTypes = useTriples({
    p: { t: "i", i: RDF_TYPE },
    o: { t: "i", i: `${NS}Agent` },
    limit: 100,
    collection: COLLECTION,
  });

  // Query for all triples in the namespace (to get properties and relationships)
  // We query with no subject filter to get all data
  const allTriples = useTriples({
    limit: 1000,
    collection: COLLECTION,
  });

  const isLoading = consumerTypes.isLoading || brandTypes.isLoading ||
                    retailTypes.isLoading || agentTypes.isLoading || allTriples.isLoading;
  const isError = consumerTypes.isError || brandTypes.isError ||
                  retailTypes.isError || agentTypes.isError || allTriples.isError;
  const error = consumerTypes.error || brandTypes.error ||
                retailTypes.error || agentTypes.error || allTriples.error;

  // Process the results
  const { entities, relationships } = useMemo(() => {
    if (isLoading || !allTriples.triples) {
      return { entities: [], relationships: [] };
    }

    // Build entity map from type queries
    const entityMap = new Map<string, Entity>();
    const typeResults = [
      { triples: consumerTypes.triples || [], typeUri: `${NS}Consumer` },
      { triples: brandTypes.triples || [], typeUri: `${NS}Brand` },
      { triples: retailTypes.triples || [], typeUri: `${NS}Retail` },
      { triples: agentTypes.triples || [], typeUri: `${NS}Agent` },
    ];

    for (const { triples, typeUri } of typeResults) {
      const config = DOMAIN_CONFIG[typeUri];
      if (!config) continue;
      if (domain && config.domain !== domain) continue;

      for (const triple of triples) {
        const entityUri = getTermValue(triple.s);
        const entityId = uriToId(entityUri);

        if (!entityMap.has(entityUri)) {
          entityMap.set(entityUri, {
            id: entityId,
            label: entityId,
            props: {},
            domain: config.domain,
            color: config.color,
            glow: config.glow,
            icon: config.icon,
          });
        }
      }
    }

    // Process all triples to get labels, properties, and relationships
    const relationships: Relationship[] = [];
    const entityUris = new Set(entityMap.keys());

    for (const triple of allTriples.triples || []) {
      const subjectUri = getTermValue(triple.s);
      const predicate = getTermValue(triple.p);
      const value = getTermValue(triple.o);

      // Only process triples for our entities
      if (!entityUris.has(subjectUri)) continue;

      const entity = entityMap.get(subjectUri);
      if (!entity) continue;

      if (predicate === RDFS_LABEL) {
        entity.label = value;
      } else if (predicate === RDF_TYPE) {
        // Skip type triples
      } else if (OBJECT_PROPERTIES.has(predicate)) {
        // This is a relationship
        const targetId = uriToId(value);
        const toDomain = uriToDomain(value);

        relationships.push({
          from: entity.id,
          to: targetId,
          predicate: predicateToName(predicate),
          strength: 0.8,
          domain: [entity.domain, toDomain],
        });
      } else if (predicate.startsWith(NS)) {
        // Datatype property
        const propName = predicate.replace(NS, "");
        if (value && !value.startsWith("http")) {
          entity.props[propName] = value;
        }
      }
    }

    const entities = Array.from(entityMap.values());

    // Filter relationships to only include those where both entities exist
    const entityIds = new Set(entities.map(e => e.id));
    const validRelationships = relationships.filter(
      r => entityIds.has(r.from) && entityIds.has(r.to)
    );

    return { entities, relationships: validRelationships };
  }, [
    isLoading,
    consumerTypes.triples,
    brandTypes.triples,
    retailTypes.triples,
    agentTypes.triples,
    allTriples.triples,
    domain,
  ]);

  return {
    entities,
    relationships,
    isLoading,
    isError,
    error,
  };
}
