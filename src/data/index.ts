export { ONTOLOGY } from "./ontology";
export { RELATIONSHIPS } from "./relationships";
export { DEMO_QUERIES } from "./queries";

import type { Entity, DomainKey, OntologyDomain } from "../types";
import { ONTOLOGY } from "./ontology";

// Helper function to get all entities from the ontology
export function getAllEntities(): Entity[] {
  const all: Entity[] = [];
  (Object.entries(ONTOLOGY) as [DomainKey, OntologyDomain][]).forEach(([domain, data]) => {
    data.subclasses.forEach((sc) => {
      all.push({ ...sc, domain, color: data.color, glow: data.glow, icon: data.icon });
    });
  });
  return all;
}
