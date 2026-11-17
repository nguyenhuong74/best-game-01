// The four regions of the Starlight Routes campaign. Each region holds five
// routes, has its own palette and backdrop tint, and introduces one mechanic:
// Ember Belt teaches gravity, Frost Drift folds space with wormholes, Storm
// Reef blows solar wind past drifting mines, and Void Crown bends time with
// black holes, orbiting worlds and flare gates.
export const ROUTES_PER_REGION = 5;

export const REGIONS = [
  {
    name: 'Ember Belt',
    tagline: 'Learn the pull of worlds',
    mechanic: 'Gravity',
    spaceTop: '#1e0a12',
    spaceBottom: '#2e1a24',
    accent: '#ffb36b',
    accentDim: '#c47a3d',
    nebula: [16, 32, 350],
  },
  {
    name: 'Frost Drift',
    tagline: 'Fold space, skip the void',
    mechanic: 'Wormholes',
    spaceTop: '#081426',
    spaceBottom: '#12283d',
    accent: '#8fd8ff',
    accentDim: '#4d8fbf',
    nebula: [200, 220, 260],
  },
  {
    name: 'Storm Reef',
    tagline: 'Ride the wind, dodge the mines',
    mechanic: 'Wind + Mines',
    spaceTop: '#0a1f1a',
    spaceBottom: '#14332c',
    accent: '#7dffa8',
    accentDim: '#3da86a',
    nebula: [150, 180, 90],
  },
  {
    name: 'Void Crown',
    tagline: 'Where light itself is late',
    mechanic: 'Voids + Flare gates',
    spaceTop: '#160a26',
    spaceBottom: '#241239',
    accent: '#d89bff',
    accentDim: '#8f5abf',
    nebula: [280, 310, 250],
  },
];

/** The region a route index belongs to. */
export function regionOf(routeIndex) {
  return REGIONS[Math.floor(routeIndex / ROUTES_PER_REGION)];
}

/** The route's number inside its region, 1-based. */
export function routeNumberInRegion(routeIndex) {
  return (routeIndex % ROUTES_PER_REGION) + 1;
}
