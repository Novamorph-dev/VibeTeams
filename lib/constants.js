export const DOMAINS = [
  { value: "personal-training", label: "Personal Training", emoji: "💪" },
  { value: "healthcare", label: "Healthcare", emoji: "🏥" },
  { value: "financial", label: "Financial Services", emoji: "💰" },
  { value: "estate-planning", label: "Estate Planning", emoji: "🏡" },
  { value: "bookkeeping", label: "Bookkeeping", emoji: "📊" },
  { value: "e-commerce", label: "E-Commerce", emoji: "🛍️" },
  { value: "education", label: "Education", emoji: "🎓" },
  { value: "real-estate", label: "Real Estate", emoji: "🏢" },
  { value: "legal", label: "Legal Services", emoji: "⚖️" },
  { value: "food-restaurant", label: "Food & Restaurant", emoji: "🍽️" },
  { value: "travel", label: "Travel & Tourism", emoji: "✈️" },
  { value: "mental-health", label: "Mental Health", emoji: "🧠" },
  { value: "technology", label: "Technology", emoji: "💻" },
  { value: "nonprofit", label: "Non-Profit", emoji: "🤝" },
];

export const getDomainLabel = (value) => {
  const domain = DOMAINS.find((d) => d.value === value);
  if (domain) return domain.label;
  // Custom domain: un-slug and title-case it
  return value
    ? value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : value;
};

export const getDomainEmoji = (value) => {
  const domain = DOMAINS.find((d) => d.value === value);
  return domain ? domain.emoji : "🔧";
};

const TEAM_ADJECTIVES = [
  "Alpha", "Beta", "Gamma", "Delta", "Echo", "Falcon", "Ghost",
  "Hyper", "Ionic", "Jetstream", "Kernel", "Lambda", "Matrix",
  "Nexus", "Omega", "Pixel", "Quantum", "Rogue", "Sigma", "Turbo",
  "Ultra", "Vector", "Warp", "Xenon", "Yield", "Zenith",
];

export const generateTeamName = (domain, existingCount) => {
  const domainLabel = getDomainLabel(domain);
  const adjective = TEAM_ADJECTIVES[existingCount % TEAM_ADJECTIVES.length];
  return `${adjective} ${domainLabel}`;
};
