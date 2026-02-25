import { useMemo } from "react";
import { useTriples } from "@trustgraph/react-state";
import type { Entity, Relationship, DomainKey, OntologyType } from "../types";

// TrustGraph constants
const COLLECTION = "retail";
const NS = "http://trustgraph.ai/retail#";
const RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
const RDFS_LABEL = "http://www.w3.org/2000/01/rdf-schema#label";
const OWL_DATATYPE_PROPERTY = "http://www.w3.org/2002/07/owl#DatatypeProperty";
const OWL_OBJECT_PROPERTY = "http://www.w3.org/2002/07/owl#ObjectProperty";

// Domain configuration - maps class URIs to domain metadata
const DOMAIN_CONFIG: Record<string, { domain: DomainKey; color: string; glow: string; icon: string; description: string }> = {
  [`${NS}Consumer`]: {
    domain: "consumer",
    color: "#6EE7B7",
    glow: "rgba(110,231,183,0.4)",
    icon: "👤",
    description: "Individuals and segments interacting with brands through retail channels",
  },
  [`${NS}Brand`]: {
    domain: "brand",
    color: "#F9A8D4",
    glow: "rgba(249,168,212,0.4)",
    icon: "✦",
    description: "Product brands seeking to connect with consumers through retail experiences",
  },
  [`${NS}Retail`]: {
    domain: "retail",
    color: "#93C5FD",
    glow: "rgba(147,197,253,0.4)",
    icon: "🏬",
    description: "Channels, touchpoints, and experiences where brands meet consumers",
  },
  [`${NS}Agent`]: {
    domain: "agent",
    color: "#FCD34D",
    glow: "rgba(252,211,77,0.4)",
    icon: "⚡",
    description: "AI agents that orchestrate personalized brand-consumer connections",
  },
};

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

export function useGraphData(domain?: DomainKey) {
  // Single query for all triples
  const allTriples = useTriples({
    limit: 1000,
    collection: COLLECTION,
  });

  const isLoading = allTriples.isLoading;
  const isError = allTriples.isError;
  const error = allTriples.error;

  // Process all data from the single query
  const { entities, relationships, ontology, propertyLabels } = useMemo(() => {
    if (isLoading || !allTriples.triples) {
      return { entities: [], relationships: [], ontology: undefined, propertyLabels: {} };
    }

    // First pass: collect all labels and find property URIs
    const allLabels = new Map<string, string>();
    const propertyUris = new Set<string>();

    for (const triple of allTriples.triples) {
      const subjectUri = getTermValue(triple.s);
      const predicate = getTermValue(triple.p);
      const objectUri = getTermValue(triple.o);

      if (predicate === RDFS_LABEL) {
        allLabels.set(subjectUri, getTermValue(triple.o));
      } else if (predicate === RDF_TYPE && (objectUri === OWL_DATATYPE_PROPERTY || objectUri === OWL_OBJECT_PROPERTY)) {
        propertyUris.add(subjectUri);
      }
    }

    // Build property labels map: local name -> label
    const propertyLabels: Record<string, string> = {};
    for (const propUri of propertyUris) {
      const localName = uriToId(propUri);
      const label = allLabels.get(propUri);
      if (label) {
        propertyLabels[localName] = label;
      }
    }

    // Second pass: find entities and their properties
    const entityMap = new Map<string, Entity>();
    const entityLabels = new Map<string, string>();
    const entityProps = new Map<string, Record<string, string | number>>();

    // Collect labels and props
    for (const triple of allTriples.triples) {
      const subjectUri = getTermValue(triple.s);
      const predicate = getTermValue(triple.p);
      const value = getTermValue(triple.o);

      if (predicate === RDFS_LABEL) {
        entityLabels.set(subjectUri, value);
      } else if (predicate.startsWith(NS) && value && !value.startsWith("http")) {
        if (!entityProps.has(subjectUri)) {
          entityProps.set(subjectUri, {});
        }
        const propName = predicate.replace(NS, "");
        entityProps.get(subjectUri)![propName] = value;
      }
    }

    // Find entities by type
    for (const triple of allTriples.triples) {
      const subjectUri = getTermValue(triple.s);
      const predicate = getTermValue(triple.p);
      const objectUri = getTermValue(triple.o);

      if (predicate === RDF_TYPE && DOMAIN_CONFIG[objectUri]) {
        const config = DOMAIN_CONFIG[objectUri];
        if (domain && config.domain !== domain) continue;

        const entityId = uriToId(subjectUri);
        entityMap.set(subjectUri, {
          id: entityId,
          uri: subjectUri,
          label: entityLabels.get(subjectUri) || entityId,
          props: entityProps.get(subjectUri) || {},
          domain: config.domain,
          color: config.color,
          glow: config.glow,
          icon: config.icon,
        });
      }
    }

    // Find relationships: triples where both subject and object are known entities
    const relationships: Relationship[] = [];
    const entityUris = new Set(entityMap.keys());

    for (const triple of allTriples.triples) {
      const subjectUri = getTermValue(triple.s);
      const predicate = getTermValue(triple.p);
      const objectUri = getTermValue(triple.o);

      // Skip rdf:type and rdfs:label
      if (predicate === RDF_TYPE || predicate === RDFS_LABEL) continue;

      // If both subject and object are entities, it's a relationship
      if (entityUris.has(subjectUri) && entityUris.has(objectUri)) {
        const fromEntity = entityMap.get(subjectUri)!;
        const toEntity = entityMap.get(objectUri)!;

        relationships.push({
          from: fromEntity.id,
          to: toEntity.id,
          predicate: predicateToName(predicate),
          strength: 0.8,
          domain: [fromEntity.domain, toEntity.domain],
        });
      }
    }

    const entities = Array.from(entityMap.values());

    // Build ontology metadata for components that need it
    const ontology: OntologyType = {
      consumer: {
        label: "Consumer",
        color: "#6EE7B7",
        glow: "rgba(110,231,183,0.4)",
        icon: "👤",
        description: "Individuals and segments interacting with brands through retail channels",
        properties: [],
        subclasses: entities.filter(e => e.domain === "consumer").map(e => ({
          id: e.id,
          uri: e.uri,
          label: e.label,
          props: e.props,
        })),
      },
      brand: {
        label: "Brand",
        color: "#F9A8D4",
        glow: "rgba(249,168,212,0.4)",
        icon: "✦",
        description: "Product brands seeking to connect with consumers through retail experiences",
        properties: [],
        subclasses: entities.filter(e => e.domain === "brand").map(e => ({
          id: e.id,
          uri: e.uri,
          label: e.label,
          props: e.props,
        })),
      },
      retail: {
        label: "Retail",
        color: "#93C5FD",
        glow: "rgba(147,197,253,0.4)",
        icon: "🏬",
        description: "Channels, touchpoints, and experiences where brands meet consumers",
        properties: [],
        subclasses: entities.filter(e => e.domain === "retail").map(e => ({
          id: e.id,
          uri: e.uri,
          label: e.label,
          props: e.props,
        })),
      },
      agent: {
        label: "Agent",
        color: "#FCD34D",
        glow: "rgba(252,211,77,0.4)",
        icon: "⚡",
        description: "AI agents that orchestrate personalized brand-consumer connections",
        properties: [],
        subclasses: entities.filter(e => e.domain === "agent").map(e => ({
          id: e.id,
          uri: e.uri,
          label: e.label,
          props: e.props,
        })),
      },
    };

    return { entities, relationships, ontology, propertyLabels };
  }, [isLoading, allTriples.triples, domain]);

  return {
    entities,
    relationships,
    ontology,
    propertyLabels,
    isLoading,
    isError,
    error,
  };
}
