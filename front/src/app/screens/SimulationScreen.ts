import type { AppPath } from "@app/navigation/NavigationAdapter";
import type { RouteContext, Screen } from "@app/router/Screen";
import { LOGIN_ROUTE, type WorkspaceRoute } from "@app/routes";
import { APP_TEXTS } from "@texts";
import { createWorkspaceMarkup } from "./templates";
import { SimulationWorkspace } from "@app/simulation/SimulationWorkspace";

export class SimulationScreen implements Screen {
  private _root?: HTMLElement;
  private _workspace?: SimulationWorkspace;
  private _backToLoginBtn?: HTMLButtonElement;

  constructor(
    private readonly _route: WorkspaceRoute,
    private readonly _navigate: (path: AppPath) => Promise<void>,
  ) {}

  public mount(container: HTMLElement): void {
    const root = document.createElement("div");
    root.innerHTML = createWorkspaceMarkup(this._route);
    this._root = root.firstElementChild as HTMLElement;
    container.replaceChildren(this._root);
    this._backToLoginBtn = this._root.querySelector<HTMLButtonElement>(".workspace-login-link") ?? undefined;
  }

  public async enter(context: RouteContext): Promise<void> {
    document.title = `${APP_TEXTS.document.title} | ${this._route.slice(1)}`;
    this._backToLoginBtn?.addEventListener("click", this._onBackToLogin);

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
    this._backToLoginBtn?.removeEventListener("click", this._onBackToLogin);
    this._workspace?.destroy();
  }

  public destroy(): void {
    this._workspace = undefined;
    this._backToLoginBtn = undefined;
    this._root = undefined;
  }

  private _onBackToLogin = (): void => {
    void this._navigate(LOGIN_ROUTE);
  };
}
