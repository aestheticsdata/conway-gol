import { LOGIN_ROUTE } from "@app/routes";
import SessionService from "@services/SessionService";
import { APP_TEXTS } from "@texts";
import WorkspaceUserMenu from "@ui/lib/WorkspaceUserMenu";
import { createDocumentationView } from "./html";

import type { AppPath } from "@navigation/NavigationAdapter";
import type { RouteContext, Screen } from "@router/Screen";

export class DocumentationView implements Screen {
  private _root?: HTMLElement;
  private _userMenu?: WorkspaceUserMenu;
  private readonly _session = new SessionService();

  constructor(private readonly _navigate: (path: AppPath) => Promise<void>) {}

  public mount(container: HTMLElement): void {
    const htmlHost = document.createElement("div");
    htmlHost.innerHTML = createDocumentationView(
      this._session.getUsernameOrFallback(),
      this._session.getAvatarIdOrFallback(),
    );
    this._root = htmlHost.firstElementChild as HTMLElement;
    container.replaceChildren(this._root);

    this._userMenu = new WorkspaceUserMenu({
      root: this._root,
      onLogout: this._onLogout,
    });
  }

  public enter(_context: RouteContext): void {
    document.title = `${APP_TEXTS.document.title} | ${APP_TEXTS.documentation.title}`;
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  public leave(): void {}

  public destroy(): void {
    this._userMenu?.destroy();
    this._userMenu = undefined;
    this._root = undefined;
  }

  private _onLogout = (): void => {
    this._session.clear();
    void this._navigate(LOGIN_ROUTE);
  };
}
