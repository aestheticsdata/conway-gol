import { ConcurrencyLimiter } from "@lib/async/concurrencyLimiter";

/** Caps parallel GET /pattern/:name for catalog entries (Zoo modal loads many cards at once). */
export const catalogPatternFetchLimiter = new ConcurrencyLimiter(6);
