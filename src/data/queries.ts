import type { DemoQuery } from "../types";

export const DEMO_QUERIES: DemoQuery[] = [
  {
    q: "Which brands should activate at the Pop-Up Experience to reach Eco-Conscious Gen Z?",
    thinking: [
      "Traversing ontology: Consumer[cs3] → has_affinity_for → Brand[br2, br4, br5]",
      "Traversing ontology: Consumer[cs3] → experiences → Retail[rt3]",
      "Cross-referencing: Brand activations at Retail[rt3]",
      "Ranking by: affinity strength × activation fit × conversion potential",
    ],
    answer: "Nordic Trail and Artisan Coffee Co. are the strongest activation candidates for the Pop-Up Experience targeting Eco-Conscious Gen Z. Nordic Trail's sustainability positioning aligns with this segment's values (affinity: 0.71) and already activates via experiential retail (strength: 0.82). Artisan Coffee Co. has existing frequency with this segment (0.58) and pop-up activation experience (0.79). Casa Verde is a secondary candidate — lower affinity (0.65) but high experiential fit.",
    entities: ["cs3", "br2", "br5", "br4", "rt3"],
    triples: 8,
  },
  {
    q: "How should Lumière Beauty optimize its engagement with Luxury Seekers across channels?",
    thinking: [
      "Resolving entities: Brand[br1] = Lumière Beauty, Consumer[cs4] = Luxury Seekers",
      "Traversing: Brand[br1] → merchandises_in → Retail[rt1], activates_via → Retail[rt3]",
      "Traversing: Consumer[cs4] → shops_via → Retail[rt1], experiences → Retail[rt3]",
      "Agent context: Personalization Agent[ag2] → personalizes_for → Consumer[cs4] (0.93)",
      "Aggregating channel overlap and engagement signals",
    ],
    answer: "Lumière Beauty has exceptional alignment with Luxury Seekers — the strongest brand-consumer affinity in the graph (0.92). Both converge on Flagship Store NYC and Pop-Up Experiences. The Personalization Agent already achieves 93% accuracy for this segment. Recommendation: Deepen the flagship in-store experience with agent-powered personalized consultations, and create exclusive pop-up previews. The loyalty-to-advocacy pipeline is strong (journey stage: Advocate) — leverage this for referral programs through the Loyalty Hub.",
    entities: ["br1", "cs4", "rt1", "rt3", "ag2", "rt5"],
    triples: 12,
  },
  {
    q: "What's the optimal agent configuration for the Mobile Commerce channel?",
    thinking: [
      "Resolving: Retail[rt2] = Mobile Commerce App",
      "Traversing: Agent → tailors_experience_at → Retail[rt2]",
      "Traversing: Consumer → shops_via → Retail[rt2]: [cs1, cs5]",
      "Traversing: Brand → sells_through → Retail[rt2]: [br3]",
      "Evaluating agent capabilities against mobile channel requirements",
    ],
    answer: "Mobile Commerce currently has the Personalization Agent deployed (experience tailoring, 85% strength). Primary consumer segments are Urban Millennials (0.82) and Weekend Warriors (0.72). Add the Recommendation Agent — it already serves Urban Millennials (0.87) and can curate Velo Sport products (the channel's primary brand). The Journey Optimizer should be connected to reduce the gap between the channel's high traffic (1.2M/mo) and moderate conversion (4.7%). Projected improvement: 2.1% conversion lift through graph-informed product sequencing.",
    entities: ["rt2", "ag2", "ag1", "ag5", "cs1", "cs5", "br3"],
    triples: 11,
  },
];
