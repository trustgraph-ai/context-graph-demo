import { useMemo } from "react";
import { useTriples } from "@trustgraph/react-state";
import type { Relationship, DomainKey } from "../types";

// TrustGraph constants
const COLLECTION = "retail";
const NS = "http://trustgraph.ai/retail#";

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

// Build entity URI from ID
function idToUri(entityId: string): string {
  return `https://trustgraph.ai/retail/${entityId}`;
}

export function useEntityRelationships(entityId: string | undefined) {
  const entityUri = entityId ? idToUri(entityId) : undefined;

  // Query for outgoing relationships (entity is subject)
  const outgoingTriples = useTriples({
    s: entityUri ? { t: "i", i: entityUri } : undefined,
    limit: 100,
    collection: COLLECTION,
  });

  // Query for incoming relationships (entity is object)
  const incomingTriples = useTriples({
    o: entityUri ? { t: "i", i: entityUri } : undefined,
    limit: 100,
    collection: COLLECTION,
  });

  const isLoading = outgoingTriples.isLoading || incomingTriples.isLoading;
  const isError = outgoingTriples.isError || incomingTriples.isError;
  const error = outgoingTriples.error || incomingTriples.error;

  const { incoming, outgoing } = useMemo(() => {
    if (!entityId) {
      return { incoming: [], outgoing: [] };
    }

    const outgoing: Relationship[] = [];
    const incoming: Relationship[] = [];

    // Process outgoing triples
    for (const triple of outgoingTriples.triples || []) {
      const predicate = getTermValue(triple.p);
      const targetUri = getTermValue(triple.o);

      if (OBJECT_PROPERTIES.has(predicate)) {
        const fromDomain = uriToDomain(entityId);
        const toDomain = uriToDomain(targetUri);

        outgoing.push({
          from: entityId,
          to: uriToId(targetUri),
          predicate: predicateToName(predicate),
          strength: 0.8,
          domain: [fromDomain, toDomain],
        });
      }
    }

    // Process incoming triples
    for (const triple of incomingTriples.triples || []) {
      const predicate = getTermValue(triple.p);
      const sourceUri = getTermValue(triple.s);

      if (OBJECT_PROPERTIES.has(predicate)) {
        const fromDomain = uriToDomain(sourceUri);
        const toDomain = uriToDomain(entityId);

        incoming.push({
          from: uriToId(sourceUri),
          to: entityId,
          predicate: predicateToName(predicate),
          strength: 0.8,
          domain: [fromDomain, toDomain],
        });
      }
    }

    return { incoming, outgoing };
  }, [entityId, outgoingTriples.triples, incomingTriples.triples]);

  return {
    incoming,
    outgoing,
    isLoading,
    isError,
    error,
  };
}
