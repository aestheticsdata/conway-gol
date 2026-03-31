export type GeometrizeRng = () => number;

export type Region = { r0: number; c0: number; r1: number; c1: number };

export type RegionOp = "sym" | "regular" | "sym_then_regular" | "regular_then_sym" | "none";
