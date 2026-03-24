export const APP_TEXTS = {
  document: {
    title: "Conway's game of life",
  },
  modes: {
    label: "Mode",
    random: "random",
    zoo: "zoo",
    drawing: "drawing",
  },
  playback: {
    iteration: "Iteration:",
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
    noiseTypes: {
      uniform: "Uniform",
      perlinLike: "Perlin-like",
      clusters: "Clusters",
      gradient: "Gradient",
      edgeBias: "Edge bias",
      centerBurst: "Center burst",
    },
    noiseTypeTiles: {
      uniform: "Uniform",
      perlinLike: "Perlin",
      clusters: "Clusters",
      gradient: "Gradient",
      edgeBias: "Edge bias",
      centerBurst: "Center burst",
    },
    rotation: "Rotation:",
    zoom: "Zoom:",
    seed: "Seed:",
    autoSeed: "Random seed",
    seedSliderDisabledHint: "Uncheck Random seed to enable slider",
    generate: "Generate",
    reset: "Reset",
  },
  zoo: {
    species: "Species:",
  },
  comments: {
    itemPrefix: "- ",
  },
} as const;
