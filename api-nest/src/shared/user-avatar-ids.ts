/**
 * Canonical avatar ids: edit this list when adding or renaming presets.
 * - Adding: append a new id here, then add the matching entry in
 *   `front/src/assets/icons/userAvatars.ts` (runtime assert ties them together).
 * - Renaming: add `{ "old-id": "new-id" }` to AVATAR_ID_ALIASES so rows already
 *   stored in DB keep working; optionally run a SQL migration to rewrite rows.
 */
export const USER_AVATAR_IDS = [
  "node-grid",
  "tri-core",
  "hex-scan",
  "circuit-gate",
  "axis-cube",
  "radar-ring",
  "signal-weave",
  "pixel-cross",
  "orbital-link",
  "quantum-slab",
  "grid-diamond",
  "pulse-node",
  "data-prism",
  "core-stack",
  "flux-gate",
  "neon-bridge",
  "logic-loop",
  "vector-mesh",
  "echo-sphere",
  "split-beam",
  "phase-rail",
  "nano-grid",
  "servo-link",
  "prism-fold",
  "lattice-hub",
  "sector-array",
  "ion-frame",
  "relay-knot",
  "sync-axis",
  "matrix-pin",
] as const;

export type UserAvatarId = (typeof USER_AVATAR_IDS)[number];

export const DEFAULT_USER_AVATAR_ID: UserAvatarId = "node-grid";

/** Old stored id → current canonical id (survives renames without DB migration). */
export const AVATAR_ID_ALIASES: Partial<Record<string, UserAvatarId>> = {};

export const USER_AVATAR_ID_LIST: string[] = [...USER_AVATAR_IDS];

export function isCanonicalUserAvatarId(id: string): id is UserAvatarId {
  return (USER_AVATAR_IDS as readonly string[]).includes(id);
}

/** Value from DB/session → canonical id for API and UI; unknown legacy values → null. */
export function resolveCanonicalAvatarId(stored: string | null | undefined): UserAvatarId | null {
  if (stored == null || stored === "") {
    return null;
  }
  const mapped = AVATAR_ID_ALIASES[stored];
  if (mapped) {
    return mapped;
  }
  if (isCanonicalUserAvatarId(stored)) {
    return stored;
  }
  return null;
}

/** Ensures `userAvatars.ts` options match this catalog exactly (throws at startup if not). */
export function assertAvatarOptionsMatchCanonicalCatalog(options: readonly { id: string }[]): void {
  const optionIds = new Set(options.map((o) => o.id));
  for (const id of USER_AVATAR_IDS) {
    if (!optionIds.has(id)) {
      throw new Error(`userAvatars.ts: missing option for canonical id "${id}"`);
    }
  }
  for (const o of options) {
    if (!isCanonicalUserAvatarId(o.id)) {
      throw new Error(
        `userAvatars.ts: unknown option id "${o.id}" — add it to USER_AVATAR_IDS in api-nest/src/shared/user-avatar-ids.ts`,
      );
    }
  }
}
