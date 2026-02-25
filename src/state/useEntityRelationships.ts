import { useMemo } from "react";
import { useTriples } from "@trustgraph/react-state";
import { useOntologySchema } from "./useOntologySchema";
import type { Relationship, DomainKey } from "../types";

// TrustGraph constants
const COLLECTION = "retail";

// Helper to extract value from a Term
function getTermValue(term: { t: string; i?: string; v?: string }): string {
  if (term.t === "i") return term.i || "";
  if (term.t === "l") return term.v || "";
  return "";
}

// Helper to create a short ID from a URI
function uriToId(uri: string): string {
  const hashIndex = uri.lastIndexOf("#");
  const slashIndex = uri.lastIndexOf("/");
  const index = Math.max(hashIndex, slashIndex);
  return index >= 0 ? uri.substring(index + 1) : uri;
}

// Helper to extract predicate name from URI
function predicateToName(uri: string): string {
  const hashIndex = uri.lastIndexOf("#");
  const slashIndex = uri.lastIndexOf("/");
  const index = Math.max(hashIndex, slashIndex);
  const name = index >= 0 ? uri.substring(index + 1) : uri;
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

export function useEntityRelationships(entityUri: string | undefined) {

  // Get the schema to know which predicates are object properties
  const { schema } = useOntologySchema();

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
    if (!entityUri || !schema) {
      return { incoming: [], outgoing: [] };
    }

    const entityId = uriToId(entityUri);
    const objectPropertyUris = schema.objectPropertyUris;
    const outgoing: Relationship[] = [];
    const incoming: Relationship[] = [];

    // Process outgoing triples
    for (const triple of outgoingTriples.triples || []) {
      const predicate = getTermValue(triple.p);
      const targetUri = getTermValue(triple.o);

      // Only include if predicate is an object property
      if (objectPropertyUris.has(predicate)) {
        const fromDomain = uriToDomain(entityUri);
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

      // Only include if predicate is an object property
      if (objectPropertyUris.has(predicate)) {
        const fromDomain = uriToDomain(sourceUri);
        const toDomain = uriToDomain(entityUri);

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
  }, [entityUri, schema, outgoingTriples.triples, incomingTriples.triples]);

  return {
    incoming,
    outgoing,
    isLoading,
    isError,
    error,
  };
}
