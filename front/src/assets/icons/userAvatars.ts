export const DEFAULT_USER_AVATAR_ID = "node-grid";

export type UserAvatarOption = {
  id: string;
  label: string;
  svg: string;
};

export const USER_AVATAR_OPTIONS: readonly UserAvatarOption[] = [
  {
    id: "node-grid",
    label: "Node Grid",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M7 6.5h10M7 12h10M7 17.5h10M6.5 7v10M12 7v10M17.5 7v10"></path>
        <circle cx="7" cy="6.5" r="1.2" fill="currentColor"></circle>
        <circle cx="12" cy="12" r="1.2" fill="currentColor"></circle>
        <circle cx="17" cy="17.5" r="1.2" fill="currentColor"></circle>
      </svg>
    `,
  },
  {
    id: "tri-core",
    label: "Tri Core",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 5.2 18 15.8H6L12 5.2Z"></path>
        <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 9.1v4.4M10 11.3h4"></path>
      </svg>
    `,
  },
  {
    id: "hex-scan",
    label: "Hex Scan",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="m12 4 6 3.4v9.2L12 20l-6-3.4V7.4L12 4Z"></path>
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M8.5 12h7"></path>
      </svg>
    `,
  },
  {
    id: "circuit-gate",
    label: "Circuit Gate",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M6 7h4v10H6zM14 9h4v6h-4z"></path>
        <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M10 12h4M4 9h2M4 15h2M18 12h2"></path>
      </svg>
    `,
  },
  {
    id: "axis-cube",
    label: "Axis Cube",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="m12 5 5.8 3.2v7.6L12 19l-5.8-3.2V8.2L12 5Z"></path>
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M6.2 8.2 12 12l5.8-3.8"></path>
      </svg>
    `,
  },
  {
    id: "radar-ring",
    label: "Radar Ring",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" stroke-width="1.7"></circle>
        <circle cx="12" cy="12" r="2.2" fill="none" stroke="currentColor" stroke-width="1.7"></circle>
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M12 12 17.5 8.5"></path>
      </svg>
    `,
  },
  {
    id: "signal-weave",
    label: "Signal Weave",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M4.5 9c1.4 0 1.8-2.8 3.2-2.8S9.5 17.8 11 17.8s1.8-11.6 3.3-11.6S16 15 17.5 15c1.2 0 1.8-2 2-3"></path>
      </svg>
    `,
  },
  {
    id: "pixel-cross",
    label: "Pixel Cross",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M10 4h4v4h-4zM4 10h4v4H4zM10 10h4v4h-4zM16 10h4v4h-4zM10 16h4v4h-4z"></path>
      </svg>
    `,
  },
  {
    id: "orbital-link",
    label: "Orbital Link",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="2" fill="currentColor"></circle>
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M12 4.5c4 0 7.5 2.5 7.5 7.5s-3.5 7.5-7.5 7.5S4.5 17 4.5 12 8 4.5 12 4.5Z"></path>
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" d="M6.5 7.5 17.5 16.5"></path>
      </svg>
    `,
  },
  {
    id: "quantum-slab",
    label: "Quantum Slab",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M5 8.5h14M5 12h14M5 15.5h14"></path>
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M8.5 6.2v11.6M15.5 6.2v11.6"></path>
      </svg>
    `,
  },
  {
    id: "grid-diamond",
    label: "Grid Diamond",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M12 4.8 19.2 12 12 19.2 4.8 12 12 4.8Z"></path>
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M12 7.7v8.6M7.7 12h8.6"></path>
      </svg>
    `,
  },
  {
    id: "pulse-node",
    label: "Pulse Node",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M4.8 12h4l1.8-4 2.7 8 1.8-4H19.2"></path>
        <circle cx="4.8" cy="12" r="1.1" fill="currentColor"></circle>
        <circle cx="19.2" cy="12" r="1.1" fill="currentColor"></circle>
      </svg>
    `,
  },
  {
    id: "data-prism",
    label: "Data Prism",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M8.2 7.2h7.6l3 4.8-3 4.8H8.2l-3-4.8 3-4.8Z"></path>
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M9.6 9.6h4.8M8.8 12h6.4M9.6 14.4h4.8"></path>
      </svg>
    `,
  },
  {
    id: "core-stack",
    label: "Core Stack",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M7 7h10v3H7zM5.6 10.5h12.8v3H5.6zM7 14h10v3H7z"></path>
      </svg>
    `,
  },
  {
    id: "flux-gate",
    label: "Flux Gate",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M8 7 5 12l3 5M16 7l3 5-3 5"></path>
        <circle cx="12" cy="12" r="2.2" fill="none" stroke="currentColor" stroke-width="1.8"></circle>
      </svg>
    `,
  },
  {
    id: "neon-bridge",
    label: "Neon Bridge",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M5.5 15.5V12a6.5 6.5 0 0 1 13 0v3.5"></path>
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M8.2 15.5v-2.3a3.8 3.8 0 0 1 7.6 0v2.3"></path>
      </svg>
    `,
  },
  {
    id: "logic-loop",
    label: "Logic Loop",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="5.5" y="5.5" width="13" height="13" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.7"></rect>
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M9 9h6v6H9z"></path>
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M12 5.5v3.5M18.5 12H15M12 18.5V15M5.5 12H9"></path>
      </svg>
    `,
  },
  {
    id: "vector-mesh",
    label: "Vector Mesh",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M6 6h12v12H6z"></path>
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M6 6 18 18M18 6 6 18M12 6v12M6 12h12"></path>
      </svg>
    `,
  },
  {
    id: "echo-sphere",
    label: "Echo Sphere",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M12 6a6 6 0 1 1-6 6"></path>
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M12 9a3 3 0 1 1-3 3"></path>
        <circle cx="12" cy="12" r="1.2" fill="currentColor"></circle>
      </svg>
    `,
  },
  {
    id: "split-beam",
    label: "Split Beam",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M8 8.2h8M6.5 15.8h11"></path>
        <circle cx="8" cy="8.2" r="1.1" fill="currentColor"></circle>
        <circle cx="16" cy="8.2" r="1.1" fill="currentColor"></circle>
        <circle cx="6.5" cy="15.8" r="1.1" fill="currentColor"></circle>
        <circle cx="17.5" cy="15.8" r="1.1" fill="currentColor"></circle>
      </svg>
    `,
  },
  {
    id: "phase-rail",
    label: "Phase Rail",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M5.2 8h13.6M5.2 12h13.6M5.2 16h13.6"></path>
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M9 8v8M15 8v8"></path>
      </svg>
    `,
  },
  {
    id: "nano-grid",
    label: "Nano Grid",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M7 7h10v10H7z"></path>
        <circle cx="9.5" cy="9.5" r="1" fill="currentColor"></circle>
        <circle cx="14.5" cy="9.5" r="1" fill="currentColor"></circle>
        <circle cx="9.5" cy="14.5" r="1" fill="currentColor"></circle>
        <circle cx="14.5" cy="14.5" r="1" fill="currentColor"></circle>
      </svg>
    `,
  },
  {
    id: "servo-link",
    label: "Servo Link",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="7.5" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="1.7"></circle>
        <circle cx="16.5" cy="12" r="2.5" fill="none" stroke="currentColor" stroke-width="1.7"></circle>
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M10 12h4"></path>
      </svg>
    `,
  },
  {
    id: "prism-fold",
    label: "Prism Fold",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="m12 5.2 5.8 3.3v7L12 18.8l-5.8-3.3v-7L12 5.2Z"></path>
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M12 5.2v13.6M6.2 8.5 12 12l5.8-3.5"></path>
      </svg>
    `,
  },
  {
    id: "lattice-hub",
    label: "Lattice Hub",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M12 5.5v13M5.5 12h13M7.5 7.5l9 9M16.5 7.5l-9 9"></path>
        <circle cx="12" cy="12" r="1.4" fill="currentColor"></circle>
      </svg>
    `,
  },
  {
    id: "sector-array",
    label: "Sector Array",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12h14"></path>
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M12 5a7 7 0 0 1 7 7M12 19a7 7 0 0 1-7-7"></path>
      </svg>
    `,
  },
  {
    id: "ion-frame",
    label: "Ion Frame",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="6" y="6" width="12" height="12" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.7"></rect>
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M9 9h6v6H9z"></path>
      </svg>
    `,
  },
  {
    id: "relay-knot",
    label: "Relay Knot",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M8 8h8v8H8z"></path>
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M12 5v3M19 12h-3M12 19v-3M5 12h3"></path>
        <circle cx="12" cy="12" r="1.1" fill="currentColor"></circle>
      </svg>
    `,
  },
  {
    id: "sync-axis",
    label: "Sync Axis",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M12 4.8v14.4M7 8.4l5-3.6 5 3.6M7 15.6l5 3.6 5-3.6"></path>
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M7.2 12h9.6"></path>
      </svg>
    `,
  },
  {
    id: "matrix-pin",
    label: "Matrix Pin",
    svg: `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M8 6.5h8v5H8zM12 11.5v6"></path>
        <path fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M9.2 17.5h5.6"></path>
        <circle cx="8" cy="6.5" r="1" fill="currentColor"></circle>
        <circle cx="16" cy="6.5" r="1" fill="currentColor"></circle>
      </svg>
    `,
  },
] as const;

export function getUserAvatarOption(avatarId: string): UserAvatarOption {
  return USER_AVATAR_OPTIONS.find((option) => option.id === avatarId) ?? USER_AVATAR_OPTIONS[0];
}
