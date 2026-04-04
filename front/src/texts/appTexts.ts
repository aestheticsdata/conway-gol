export const AUTH_VALIDATION_TEXTS = {
  username: {
    required: "Username is required.",
    length: "Use 3-24 characters.",
    characters: "Use letters, numbers, _ or -.",
  },
  password: {
    required: "Password is required.",
    rule: "Use 8+ chars with at least one upper, lower, number, and symbol.",
    confirmRequired: "Confirm your password.",
    mismatch: "Passwords do not match.",
  },
  email: {
    required: "Email is required.",
    invalid: "Enter a valid email address.",
  },
  recoveryPassphrase: {
    currentRequired: "Current recovery passphrase is required.",
    currentInvalid: "Current recovery passphrase is incorrect.",
    required: "Recovery passphrase is required.",
    rule: "Use 10+ characters.",
    confirmRequired: "Confirm your recovery passphrase.",
    mismatch: "Recovery passphrases do not match.",
  },
} as const;

/** Labels for random-mode preset ids (`RANDOM_PRESETS` in `@grid/randomPresets`). */
export const GRID_TEXTS = {
  randomPresets: {
    stars: "Stars",
    circles: "Random circles",
    sinus: "Sine waves",
    rings: "Rings",
    stripes: "Stripes",
    checker: "Checkerboard",
    clusters: "Clusters",
    sierpinski: "Sierpinski triangles",
    cantor: "Cantor dust",
    hilbert: "Hilbert curve",
    diagonal: "Diagonals",
    cross: "Cross",
    noise: "Classic noise",
    conway: "Primordial bits",
  },
} as const;

export const DATA_TEXTS = {
  errors: {
    fetchingCritter: "Error fetching critter:",
    speciesNotFound: (entity: string) => `Species "${entity}" not found in API or local species`,
    invalidCritterData: "Invalid critter data:",
  },
} as const;

export const CONTROL_TEXTS = {
  drawing: {
    saveButton: "Save Drawing",
    exportButton: "Export to .hxf",
    importHxfButton: "Import .hxf",
    exportModalTitle: "Export as .hxf",
    exportModalPlaceholder: "File name",
    exportModalConfirm: "Export",
    exportModalCancel: "Cancel",
    exportModalClose: "Close export dialog",
    hxfImportErrorTitle: "Import failed",
    hxfImportParseError: "This file is not valid .hxf (JSON) data.",
    hxfImportGridError: "Pattern must be a full grid of 0s and 1s matching the drawing canvas size.",
    hxfImportSavingStatus: "Saving pattern…",
    hxfImportCompleteMessage: "Import complete",
    hxfImportCloseLabel: "Close",
    sessionExpiredTitle: "Session expired",
    sessionExpiredMessage: "Your session expired. Reconnect to save drawings.",
    clearCanvasButton: "Clear canvas",
    restoreButton: "Restore",
    restoreDisabledHint: "Restore drawing after changes",
    savedPatternsLabel: "Saved patterns",
    cursorCoordinatesLabel: "Cursor coordinates",
    cursorXAxisLabel: "X",
    cursorYAxisLabel: "Y",
    brushSizeLabel: "Brush Size",
    brushShapeLabel: "Brush Shape",
    tools: {
      pencilAlt: "pencil",
      eraserAlt: "eraser",
      handAlt: "hand",
    },
    shapes: {
      square: "Square",
      cross: "Cross",
      hollowSquare: "Hollow Square",
      circle: "Circle",
      hollowCircle: "Hollow Circle",
      diamond: "Diamond",
      hollowDiamond: "Hollow Diamond",
      hline: "H-Line",
      vline: "V-Line",
      x: "X-Shape",
    },
  },
  userCustomSelector: {
    placeholder: "select custom pattern",
    prompt: {
      title: "save custom preset",
      inputPlaceholder: "preset name",
      confirmButtonText: "save",
      cancelButtonText: "cancel",
      closeButtonLabel: "close modal",
      filenameRequired: "filename required",
    },
  },
} as const;

export const APP_TEXTS = {
  document: {
    title: "Conway's game of life",
  },
  auth: {
    eyebrow: "Conway's Game of Life",
    clearUsername: "Clear username",
    continueAsGuest: "Continue as guest",
    nav: {
      login: "Login",
      register: "Register",
      about: "About",
    },
  },
  workspace: {
    studioTitle: "CGL Studio",
    logOut: "Log out",
    userMenu: {
      settings: "Settings",
      documentation: "Documentation",
      guestLabel: "Guest mode",
      guestName: "Guest",
      lexicon: "Lexicon",
      signIn: "Sign in",
      signedInAs: "Signed in as",
    },
  },
  documentation: {
    title: "Documentation",
    backToSimulation: "Back to Simulation",
  },
  lexicon: {
    title: "Lexicon",
    backToSimulation: "Back to Simulation",
    backToTop: "Back to top",
    openDocumentation: "Documentation",
  },
  settings: {
    title: "Settings",
    backToStudio: "Back to Studio",
    saveChanges: "Save changes",
    changesSaved: "Changes saved locally.",
    intro: "Manage your authenticated studio profile.",
    account: {
      eyebrow: "Username",
      title: "Current username",
      copy: "Username and avatar changes are applied when you save.",
      statusLabel: "Session mode",
      statusValue: "Authenticated session",
    },
    avatar: {
      eyebrow: "Avatar",
    },
    recovery: {
      eyebrow: "Passphrase",
      title: "Recovery passphrase",
      copy: "Keep your recovery passphrase somewhere safe. The app does not send recovery emails.",
      action: "Change passphrase",
      changed: "Passphrase updated locally.",
    },
    password: {
      eyebrow: "Password",
      copy: AUTH_VALIDATION_TEXTS.password.rule,
      action: "Change password",
      changed: "Password updated locally.",
    },
    session: {
      eyebrow: "Session",
      title: "Session controls",
      copy: "Logging out clears the local browser session and sends you back to the login screen.",
    },
  },
  modes: {
    label: "Mode",
    random: "random",
    zoo: "zoo",
    drawing: "drawing",
  },
  playback: {
    iteration: "Iteration:",
    stabilization: "Stable after:",
    cycleDetected: "Cycle period:",
    aliveCells: "Alive cells:",
    deadCells: "Dead cells:",
    fps: "FPS:",
    aliveVariation: "Alive variation (raw)",
    aliveCount: "Alive cells (absolute)",
    start: "start",
    pause: "pause",
  },
  canvas: {
    unsupported: "canvas not available in this browser",
  },
  random: {
    preset: "Random shape type:",
    density: "Density:",
    noiseType: "Noise type:",
    noiseLevel: "Noise level:",
    noiseTypes: {
      uniform: "Uniform",
      perlinLike: "Perlin-like",
      clusters: "Clusters",
      gradient: "Gradient",
      edgeBias: "Edge bias",
      centerBurst: "Center burst",
      interference: "Interference",
      marbling: "Marbling",
    },
    noiseTypeTiles: {
      uniform: "Uniform",
      perlinLike: "Perlin",
      clusters: "Clusters",
      gradient: "Gradient",
      edgeBias: "Edge bias",
      centerBurst: "Center burst",
      interference: "Moiré",
      marbling: "Marbling",
    },
    rotation: "Rotation:",
    zoom: "Zoom:",
    seed: "Seed:",
    autoSeed: "Random seed",
    seedSliderDisabledHint: "Uncheck Random seed to enable slider",
    randomizePane: "randomize parameters",
    geometrizePane: "Add geometry",
    geometrizeExperimentalHint: "Experimental feature — results can be unpredictable.",
    generate: "Generate",
    save: "Save",
    reset: "Reset",
  },
  zoo: {
    species: "Pattern",
    patternListsButton: "Patterns list",
    patternListsTitle: "Patterns list",
    searchPlaceholder: "Search patterns...",
    unknownAuthor: "Community archive",
    loadingDescription: "Loading pattern details...",
    fallbackDescription: "Catalog pattern from the Conway Life archive.",
    emptySearch: "No patterns match this search.",
    favoriteLabel: "Toggle favorite",
    favoriteCountLabel: "Favorites",
    favoriteGuestHint: "Sign in to favorite patterns.",
    closePatternLists: "Close patterns list",
    patternCountSingular: "pattern",
    patternCountPlural: "patterns",
  },
  drawing: {
    saveGuestHint: "Sign in to save drawings.",
  },
  guest: {
    signInCallToAction: "Sign in to unlock saving, favorites and settings.",
  },
  comments: {
    itemPrefix: "- ",
  },
} as const;

export function formatZooPatternListsCountSuffix(visibleCount: number): string {
  const noun = visibleCount === 1 ? APP_TEXTS.zoo.patternCountSingular : APP_TEXTS.zoo.patternCountPlural;
  return ` (${visibleCount} ${noun})`;
}

export function formatZooPatternListsTitle(visibleCount: number): string {
  return `${APP_TEXTS.zoo.patternListsTitle}${formatZooPatternListsCountSuffix(visibleCount)}`;
}
