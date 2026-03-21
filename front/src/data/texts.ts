export const DATA_TEXTS = {
  errors: {
    fetchingCritter: "Error fetching critter:",
    speciesNotFound: (entity: string) =>
      `Species "${entity}" not found in API or local species`,
    invalidCritterData: "Invalid critter data:",
  },
} as const;
