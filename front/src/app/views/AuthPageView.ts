import { APP_TEXTS } from "@texts";

import type { RouteContext, Screen } from "@router/Screen";

type AuthSubmitHandler = (form: HTMLFormElement) => void | Promise<void>;

type AuthPageViewOptions = {
  documentTitle: string;
  render: () => string;
  onSubmit?: AuthSubmitHandler;
};

export class AuthPageView implements Screen {
  private _root?: HTMLElement;
  private _form?: HTMLFormElement;
  private _openAnimationFrame?: number;

  constructor(private readonly _options: AuthPageViewOptions) {}

  public mount(container: HTMLElement): void {
    const htmlHost = document.createElement("div");
    htmlHost.innerHTML = this._options.render();
    this._root = htmlHost.firstElementChild as HTMLElement;
    container.replaceChildren(this._root);
    this._form = this._root.querySelector<HTMLFormElement>(".auth-form") ?? undefined;
  }

  public enter(_context: RouteContext): void {
    document.title = `${APP_TEXTS.document.title} | ${this._options.documentTitle}`;
    this._openAnimationFrame = requestAnimationFrame(() => {
      this._root?.classList.add("is-open");
      this._openAnimationFrame = undefined;
    });

    if (this._form && this._options.onSubmit) {
      this._form.addEventListener("submit", this._onSubmit);
    }
  }

  public leave(): void {
    if (this._openAnimationFrame !== undefined) {
      cancelAnimationFrame(this._openAnimationFrame);
      this._openAnimationFrame = undefined;
    }

    this._root?.classList.remove("is-open");

    if (this._form && this._options.onSubmit) {
      this._form.removeEventListener("submit", this._onSubmit);
    }
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

    if (!this._form) {
      return;
    }

    void this._options.onSubmit?.(this._form);
  };
}
