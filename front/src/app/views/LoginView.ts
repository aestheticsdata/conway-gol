import type { AppPath } from "@app/navigation/NavigationAdapter";
import type { Screen, RouteContext } from "@app/router/Screen";
import { SIMULATION_ROUTE } from "@app/routes";
import { createLoginView } from "@app/views/html";
import { APP_TEXTS } from "@texts";

export class LoginView implements Screen {
  private _root?: HTMLElement;
  private _form?: HTMLFormElement;

  constructor(private readonly _navigate: (path: AppPath) => Promise<void>) {}

  public mount(container: HTMLElement): void {
    const htmlHost = document.createElement("div");
    htmlHost.innerHTML = createLoginView();
    this._root = htmlHost.firstElementChild as HTMLElement;
    container.replaceChildren(this._root);
    this._form = this._root.querySelector<HTMLFormElement>(".auth-form") ?? undefined;
  }

  public enter(_context: RouteContext): void {
    document.title = `${APP_TEXTS.document.title} | Login`;
    this._form?.addEventListener("submit", this._onSubmit);
  }

  public leave(): void {
    this._form?.removeEventListener("submit", this._onSubmit);
  }

  public destroy(): void {
    this._form = undefined;
    this._root = undefined;
  }

  private _onSubmit = (event: Event): void => {
    event.preventDefault();
    void this._navigate(SIMULATION_ROUTE);
  };
}
