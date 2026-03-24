import { DEFAULT_APP_ROUTE, DRAWING_ROUTE, LOGIN_ROUTE, SIMULATION_ROUTE, ZOO_ROUTE } from "@app/routes";
import { queryRequired } from "@helpers/dom";
import { NavigationApiAdapter } from "@navigation/NavigationApiAdapter";
import { AppRouter } from "@router/AppRouter";
import { normalizeBasePath } from "@router/paths";
import { LoginView } from "@views/LoginView";
import { SimulationView } from "@views/SimulationView";

import type { AppPath } from "@navigation/NavigationAdapter";

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
      create: () => new LoginView(navigate),
    },
    {
      path: SIMULATION_ROUTE,
      create: () => new SimulationView(SIMULATION_ROUTE, navigate),
    },
    {
      path: ZOO_ROUTE,
      create: () => new SimulationView(ZOO_ROUTE, navigate),
    },
    {
      path: DRAWING_ROUTE,
      create: () => new SimulationView(DRAWING_ROUTE, navigate),
    },
  ],
  DEFAULT_APP_ROUTE,
);

void router.start();
