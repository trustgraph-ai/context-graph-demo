import { useMemo } from "react";
import { useTriples } from "@trustgraph/react-state";
import type { OntologyType, DomainKey, Subclass } from "../types";

// TrustGraph constants
const COLLECTION = "retail";
const NS = "http://trustgraph.ai/retail#";
const RDF_TYPE = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type";
const RDFS_LABEL = "http://www.w3.org/2000/01/rdf-schema#label";

// Static domain metadata (configuration)
const DOMAIN_META: Record<DomainKey, { label: string; color: string; glow: string; icon: string; description: string; properties: string[] }> = {
  consumer: {
    label: "Consumer",
    color: "#6EE7B7",
    glow: "rgba(110,231,183,0.4)",
    icon: "👤",
    description: "Individuals and segments interacting with brands through retail channels",
    properties: ["segment", "preferences", "journeyStage", "lifetime_value", "sentiment"],
  },
  brand: {
    label: "Brand",
    color: "#F9A8D4",
    glow: "rgba(249,168,212,0.4)",
    icon: "✦",
    description: "Product brands seeking to connect with consumers through retail experiences",
    properties: ["identity", "positioning", "campaigns", "products", "partnerships"],
  },
  retail: {
    label: "Retail",
    color: "#93C5FD",
    glow: "rgba(147,197,253,0.4)",
    icon: "🏬",
    description: "Channels, touchpoints, and experiences where brands meet consumers",
    properties: ["channel", "location", "traffic", "conversionRate", "experience_score"],
  },
  agent: {
    label: "Agent",
    color: "#FCD34D",
    glow: "rgba(252,211,77,0.4)",
    icon: "⚡",
    description: "AI agents that orchestrate personalized brand-consumer connections",
    properties: ["capability", "contextSources", "accuracy", "latency", "decisions_per_day"],
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
  const parts = uri.split("/");
  return parts[parts.length - 1];
}

export function useOntology() {
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

  // Query for all triples to get labels and properties
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

  // Build the ontology from query results
  const ontology = useMemo((): OntologyType | undefined => {
    if (isLoading || !allTriples.triples) {
      return undefined;
    }

    // Build entity info map from all triples
    const entityInfo = new Map<string, { label: string; props: Record<string, string | number> }>();

    for (const triple of allTriples.triples || []) {
      const subjectUri = getTermValue(triple.s);
      const predicate = getTermValue(triple.p);
      const value = getTermValue(triple.o);

      if (!entityInfo.has(subjectUri)) {
        entityInfo.set(subjectUri, { label: uriToId(subjectUri), props: {} });
      }

      const info = entityInfo.get(subjectUri)!;

      if (predicate === RDFS_LABEL) {
        info.label = value;
      } else if (predicate.startsWith(NS) && value && !value.startsWith("http")) {
        const propName = predicate.replace(NS, "");
        info.props[propName] = value;
      }
    }

    // Build subclasses for each domain
    const domainSubclasses: Record<DomainKey, Subclass[]> = {
      consumer: [],
      brand: [],
      retail: [],
      agent: [],
    };

    const typeResults = [
      { triples: consumerTypes.triples || [], domain: "consumer" as DomainKey },
      { triples: brandTypes.triples || [], domain: "brand" as DomainKey },
      { triples: retailTypes.triples || [], domain: "retail" as DomainKey },
      { triples: agentTypes.triples || [], domain: "agent" as DomainKey },
    ];

    for (const { triples, domain } of typeResults) {
      for (const triple of triples) {
        const entityUri = getTermValue(triple.s);
        const entityId = uriToId(entityUri);
        const info = entityInfo.get(entityUri);

        domainSubclasses[domain].push({
          id: entityId,
          label: info?.label || entityId,
          props: info?.props || {},
        });
      }
    }

    return {
      consumer: { ...DOMAIN_META.consumer, subclasses: domainSubclasses.consumer },
      brand: { ...DOMAIN_META.brand, subclasses: domainSubclasses.brand },
      retail: { ...DOMAIN_META.retail, subclasses: domainSubclasses.retail },
      agent: { ...DOMAIN_META.agent, subclasses: domainSubclasses.agent },
    };
  }, [
    isLoading,
    consumerTypes.triples,
    brandTypes.triples,
    retailTypes.triples,
    agentTypes.triples,
    allTriples.triples,
  ]);

  return {
    ontology,
    isLoading,
    isError,
    error,
  };
}
