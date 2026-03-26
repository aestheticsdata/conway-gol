import { SIMULATION_ROUTE } from "@app/routes";
import { APP_TEXTS } from "@texts";
import { createLoginView } from "./html";

import type { AppPath } from "@navigation/NavigationAdapter";
import type { RouteContext, Screen } from "@router/Screen";

export class LoginView implements Screen {
  private _root?: HTMLElement;
  private _form?: HTMLFormElement;
  private _openAnimationFrame?: number;

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
    this._openAnimationFrame = requestAnimationFrame(() => {
      this._root?.classList.add("is-open");
      this._openAnimationFrame = undefined;
    });
    this._form?.addEventListener("submit", this._onSubmit);
  }

  public leave(): void {
    if (this._openAnimationFrame !== undefined) {
      cancelAnimationFrame(this._openAnimationFrame);
      this._openAnimationFrame = undefined;
    }
    this._root?.classList.remove("is-open");
    this._form?.removeEventListener("submit", this._onSubmit);
  }

  public destroy(): void {
    if (this._openAnimationFrame !== undefined) {
      cancelAnimationFrame(this._openAnimationFrame);
      this._openAnimationFrame = undefined;
    }
    this._form = undefined;
    this._root = undefined;
  }

  private _onSubmit = (event: Event): void => {
    event.preventDefault();
    void this._navigate(SIMULATION_ROUTE);
  };
}
