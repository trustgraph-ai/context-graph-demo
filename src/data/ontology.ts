import type { OntologyType } from "../types";

export const ONTOLOGY: OntologyType = {
  consumer: {
    label: "Consumer",
    color: "#6EE7B7",
    glow: "rgba(110,231,183,0.4)",
    icon: "👤",
    description: "Individuals and segments interacting with brands through retail channels",
    properties: ["segment", "preferences", "journeyStage", "lifetime_value", "sentiment"],
    subclasses: [
      { id: "cs1", label: "Urban Millennials", props: { size: "2.4M", avgSpend: "$142/mo", loyalty: 0.78, journeyStage: "Engaged" } },
      { id: "cs2", label: "Active Families", props: { size: "1.8M", avgSpend: "$218/mo", loyalty: 0.85, journeyStage: "Loyal" } },
      { id: "cs3", label: "Eco-Conscious Gen Z", props: { size: "3.1M", avgSpend: "$96/mo", loyalty: 0.62, journeyStage: "Exploring" } },
      { id: "cs4", label: "Luxury Seekers", props: { size: "890K", avgSpend: "$384/mo", loyalty: 0.91, journeyStage: "Advocate" } },
      { id: "cs5", label: "Weekend Warriors", props: { size: "1.5M", avgSpend: "$167/mo", loyalty: 0.73, journeyStage: "Engaged" } },
    ],
  },
  brand: {
    label: "Brand",
    color: "#F9A8D4",
    glow: "rgba(249,168,212,0.4)",
    icon: "✦",
    description: "Product brands seeking to connect with consumers through retail experiences",
    properties: ["identity", "positioning", "campaigns", "products", "partnerships"],
    subclasses: [
      { id: "br1", label: "Lumière Beauty", props: { category: "Cosmetics", positioning: "Premium", campaigns: 12, sentiment: 0.87 } },
      { id: "br2", label: "Nordic Trail", props: { category: "Outdoor Apparel", positioning: "Sustainable", campaigns: 8, sentiment: 0.82 } },
      { id: "br3", label: "Velo Sport", props: { category: "Athletics", positioning: "Performance", campaigns: 15, sentiment: 0.79 } },
      { id: "br4", label: "Casa Verde", props: { category: "Home & Living", positioning: "Artisanal", campaigns: 6, sentiment: 0.90 } },
      { id: "br5", label: "Artisan Coffee Co.", props: { category: "F&B", positioning: "Community", campaigns: 10, sentiment: 0.85 } },
    ],
  },
  retail: {
    label: "Retail",
    color: "#93C5FD",
    glow: "rgba(147,197,253,0.4)",
    icon: "🏬",
    description: "Channels, touchpoints, and experiences where brands meet consumers",
    properties: ["channel", "location", "traffic", "conversionRate", "experience_score"],
    subclasses: [
      { id: "rt1", label: "Flagship Store NYC", props: { channel: "Physical", traffic: "48K/mo", conversion: "12.3%", experience: 0.91 } },
      { id: "rt2", label: "Mobile Commerce App", props: { channel: "Digital", traffic: "1.2M/mo", conversion: "4.7%", experience: 0.78 } },
      { id: "rt3", label: "Pop-Up Experience", props: { channel: "Experiential", traffic: "8K/event", conversion: "18.6%", experience: 0.95 } },
      { id: "rt4", label: "Social Commerce", props: { channel: "Social", traffic: "890K/mo", conversion: "3.2%", experience: 0.72 } },
      { id: "rt5", label: "Loyalty Hub", props: { channel: "Omnichannel", traffic: "340K/mo", conversion: "22.1%", experience: 0.88 } },
    ],
  },
  agent: {
    label: "Agent",
    color: "#FCD34D",
    glow: "rgba(252,211,77,0.4)",
    icon: "⚡",
    description: "AI agents that orchestrate personalized brand-consumer connections",
    properties: ["capability", "contextSources", "accuracy", "latency", "decisions_per_day"],
    subclasses: [
      { id: "ag1", label: "Recommendation Agent", props: { capability: "Product Discovery", accuracy: "94.2%", latency: "120ms", decisions: "2.1M/day" } },
      { id: "ag2", label: "Personalization Agent", props: { capability: "Experience Tailoring", accuracy: "91.8%", latency: "85ms", decisions: "890K/day" } },
      { id: "ag3", label: "Campaign Orchestrator", props: { capability: "Brand Activation", accuracy: "88.5%", latency: "200ms", decisions: "340K/day" } },
      { id: "ag4", label: "Sentiment Analyst", props: { capability: "Brand Perception", accuracy: "96.1%", latency: "150ms", decisions: "1.5M/day" } },
      { id: "ag5", label: "Journey Optimizer", props: { capability: "Path Optimization", accuracy: "89.7%", latency: "180ms", decisions: "560K/day" } },
    ],
  },
};
