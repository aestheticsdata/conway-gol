import { LOGIN_ROUTE } from "@app/routes";
import { authSessionService } from "@services/AuthSessionService";
import { SimulationWorkspace } from "@simulation/SimulationWorkspace";
import { APP_TEXTS } from "@texts";
import WorkspaceUserMenu from "@ui/lib/WorkspaceUserMenu";
import { createWorkspaceView } from "./html";

import type { WorkspaceRoute } from "@app/routes";
import type { AppPath } from "@navigation/NavigationAdapter";
import type { RouteContext, Screen } from "@router/Screen";

export class SimulationView implements Screen {
  private _root?: HTMLElement;
  private _workspace?: SimulationWorkspace;
  private _userMenu?: WorkspaceUserMenu;

  constructor(
    private readonly _route: WorkspaceRoute,
    private readonly _navigate: (path: AppPath) => Promise<void>,
  ) {}

  public mount(container: HTMLElement): void {
    const viewer = authSessionService.getViewer();
    const htmlHost = document.createElement("div");
    htmlHost.innerHTML = createWorkspaceView(this._route, viewer);
    this._root = htmlHost.firstElementChild as HTMLElement;
    container.replaceChildren(this._root);

    this._userMenu = new WorkspaceUserMenu({
      root: this._root,
      onLogout: this._onLogout,
    });
  }

  public async enter(context: RouteContext): Promise<void> {
    document.title = `${APP_TEXTS.document.title} | ${this._route.slice(1)}`;

    if (!this._root) {
      return;
    }

    this._workspace = new SimulationWorkspace({
      root: this._root,
      route: this._route,
      capabilities: authSessionService.capabilities(),
      onRouteModeChange: (route) => {
        void this._navigate(route);
      },
    });

    await this._workspace.init(context.query);
  }

  public leave(): void {
    this._workspace?.destroy();
  }

  public destroy(): void {
    this._userMenu?.destroy();
    this._workspace = undefined;
    this._userMenu = undefined;
    this._root = undefined;
  }

  private _onLogout = (): void => {
    void authSessionService.logout().finally(() => {
      void this._navigate(LOGIN_ROUTE);
    });
  };
}
