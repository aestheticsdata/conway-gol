export const APP_TEXTS = {
  document: {
    title: "Conway's game of life",
  },
  modes: {
    random: "random",
    zoo: "zoo",
    drawing: "drawing",
  },
  playback: {
    iteration: "Iteration:",
    aliveCells: "Alive cells:",
    deadCells: "Dead cells:",
    fps: "FPS:",
    start: "start",
    pause: "pause",
  },
  canvas: {
    unsupported: "canvas not available in this browser",
  },
  random: {
    preset: "Random:",
    density: "Density:",
    noiseType: "Noise type:",
    noiseTypes: {
      uniform: "Uniform",
      perlinLike: "Perlin-like",
      clusters: "Clusters",
    },
    seed: "Seed:",
    autoSeed: "Random seed",
    generate: "Generate",
  },
  zoo: {
    species: "Species:",
  },
  comments: {
    itemPrefix: "- ",
  },
} as const;
