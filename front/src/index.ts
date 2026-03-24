import { NavigationApiAdapter } from "@app/navigation/NavigationApiAdapter";
import { AppRouter } from "@app/router/AppRouter";
import { normalizeBasePath } from "@app/router/paths";
import {
  DEFAULT_APP_ROUTE,
  DRAWING_ROUTE,
  LOGIN_ROUTE,
  SIMULATION_ROUTE,
  ZOO_ROUTE,
} from "@app/routes";
import { LoginScreen } from "@app/screens/LoginScreen";
import { SimulationScreen } from "@app/screens/SimulationScreen";
import { queryRequired } from "@helpers/dom";
import type { AppPath } from "@app/navigation/NavigationAdapter";

const outlet = queryRequired<HTMLElement>("#app");
const basePath = normalizeBasePath(import.meta.env.BASE_URL);
const navigationAdapter = new NavigationApiAdapter(basePath);

let router: AppRouter;
const navigate = (path: AppPath): Promise<void> => router.navigate(path);

router = new AppRouter(
  outlet,
  navigationAdapter,
  [
    {
      path: LOGIN_ROUTE,
      create: () => new LoginScreen(navigate),
    },
    {
      path: SIMULATION_ROUTE,
      create: () => new SimulationScreen(SIMULATION_ROUTE, navigate),
    },
    {
      path: ZOO_ROUTE,
      create: () => new SimulationScreen(ZOO_ROUTE, navigate),
    },
    {
      path: DRAWING_ROUTE,
      create: () => new SimulationScreen(DRAWING_ROUTE, navigate),
    },
  ],
  DEFAULT_APP_ROUTE,
);

void router.start();
