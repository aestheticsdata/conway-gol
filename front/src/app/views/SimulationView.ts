import { LOGIN_ROUTE } from "@app/routes";
import { SimulationWorkspace } from "@simulation/SimulationWorkspace";
import { APP_TEXTS } from "@texts";
import { createWorkspaceView } from "./html";

import type { WorkspaceRoute } from "@app/routes";
import type { AppPath } from "@navigation/NavigationAdapter";
import type { RouteContext, Screen } from "@router/Screen";

export class SimulationView implements Screen {
  private _root?: HTMLElement;
  private _workspace?: SimulationWorkspace;
  private _backToLoginButton?: HTMLButtonElement;

  constructor(
    private readonly _route: WorkspaceRoute,
    private readonly _navigate: (path: AppPath) => Promise<void>,
  ) {}

  public mount(container: HTMLElement): void {
    const htmlHost = document.createElement("div");
    htmlHost.innerHTML = createWorkspaceView(this._route);
    this._root = htmlHost.firstElementChild as HTMLElement;
    container.replaceChildren(this._root);
    this._backToLoginButton = this._root.querySelector<HTMLButtonElement>(".workspace-login-link") ?? undefined;
  }

  public async enter(context: RouteContext): Promise<void> {
    document.title = `${APP_TEXTS.document.title} | ${this._route.slice(1)}`;
    this._backToLoginButton?.addEventListener("click", this._onBackToLogin);

    if (!this._root) {
      return;
    }

    this._workspace = new SimulationWorkspace({
      root: this._root,
      route: this._route,
      onRouteModeChange: (route) => {
        void this._navigate(route);
      },
    });

    await this._workspace.init(context.query);
  }

  public leave(): void {
    this._backToLoginButton?.removeEventListener("click", this._onBackToLogin);
    this._workspace?.destroy();
  }

  public destroy(): void {
    this._workspace = undefined;
    this._backToLoginButton = undefined;
    this._root = undefined;
  }

  private _onBackToLogin = (): void => {
    void this._navigate(LOGIN_ROUTE);
  };
}
