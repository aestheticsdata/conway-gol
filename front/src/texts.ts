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
  recoveryPassphrase: {
    currentRequired: "Current recovery passphrase is required.",
    currentInvalid: "Current recovery passphrase is incorrect.",
    required: "Recovery passphrase is required.",
    rule: "Use 10+ characters.",
    confirmRequired: "Confirm your recovery passphrase.",
    mismatch: "Recovery passphrases do not match.",
  },
} as const;

export const APP_TEXTS = {
  document: {
    title: "Conway's game of life",
  },
  auth: {
    eyebrow: "Conway's Game of Life",
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
      signedInAs: "Signed in as",
    },
  },
  settings: {
    title: "Settings",
    backToStudio: "Back to Studio",
    saveChanges: "Save changes",
    changesSaved: "Changes saved locally.",
    intro:
      "Manage the lightweight local account state used by the studio while the full authentication backend is still being wired.",
    account: {
      eyebrow: "Username",
      title: "Current username",
      copy: "Username and avatar changes are applied when you save.",
      statusLabel: "Session mode",
      statusValue: "Local browser session",
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
    cycleDetected: "Cycle detected at:",
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
    generate: "Generate",
    save: "Save",
    reset: "Reset",
  },
  zoo: {
    species: "Species:",
  },
  comments: {
    itemPrefix: "- ",
  },
} as const;
