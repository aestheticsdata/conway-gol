import {
  ABOUT_ROUTE,
  DEFAULT_APP_ROUTE,
  DOCUMENTATION_ROUTE,
  DRAWING_ROUTE,
  LEXICON_ROUTE,
  LOGIN_ROUTE,
  REGISTER_ROUTE,
  SETTINGS_ROUTE,
  SIMULATION_ROUTE,
  ZOO_ROUTE,
} from "@app/routes";
import { queryRequired } from "@helpers/dom";
import { NavigationApiAdapter } from "@navigation/NavigationApiAdapter";
import { AppRouter } from "@router/AppRouter";
import { normalizeBasePath } from "@router/paths";
import { AboutView } from "@views/AboutView";
import { DocumentationView } from "@views/DocumentationView";
import { LexiconView } from "@views/LexiconView";
import { LoginView } from "@views/LoginView";
import { RegisterView } from "@views/RegisterView";
import { SettingsView } from "@views/SettingsView";
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
      path: REGISTER_ROUTE,
      create: () => new RegisterView(navigate),
    },
    {
      path: ABOUT_ROUTE,
      create: () => new AboutView(),
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
    {
      path: SETTINGS_ROUTE,
      create: () => new SettingsView(navigate),
    },
    {
      path: DOCUMENTATION_ROUTE,
      create: () => new DocumentationView(navigate),
    },
    {
      path: LEXICON_ROUTE,
      create: () => new LexiconView(navigate),
    },
  ],
  DEFAULT_APP_ROUTE,
);

void router.start();
