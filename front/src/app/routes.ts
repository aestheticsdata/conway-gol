import type { AppPath } from "@navigation/NavigationAdapter";
import type { Mode } from "@ui/controls/simulation/ModeSelector";

export const LOGIN_ROUTE = "/login";
export const REGISTER_ROUTE = "/register";
export const ABOUT_ROUTE = "/about";
export const SIMULATION_ROUTE = "/simulation";
export const ZOO_ROUTE = "/zoo";
export const DRAWING_ROUTE = "/drawing";
export const SETTINGS_ROUTE = "/settings";
export const DOCUMENTATION_ROUTE = "/documentation";

export type WorkspaceRoute = typeof SIMULATION_ROUTE | typeof ZOO_ROUTE | typeof DRAWING_ROUTE;

export const DEFAULT_APP_ROUTE: AppPath = LOGIN_ROUTE;

export const PUBLIC_APP_ROUTES: readonly AppPath[] = [
  LOGIN_ROUTE,
  REGISTER_ROUTE,
  ABOUT_ROUTE,
  SIMULATION_ROUTE,
  ZOO_ROUTE,
  DRAWING_ROUTE,
  SETTINGS_ROUTE,
  DOCUMENTATION_ROUTE,
];

export const WORKSPACE_ROUTE_TO_MODE: Record<WorkspaceRoute, Mode> = {
  [SIMULATION_ROUTE]: "random",
  [ZOO_ROUTE]: "zoo",
  [DRAWING_ROUTE]: "drawing",
};

export const MODE_TO_WORKSPACE_ROUTE: Record<Mode, WorkspaceRoute> = {
  random: SIMULATION_ROUTE,
  zoo: ZOO_ROUTE,
  drawing: DRAWING_ROUTE,
};
