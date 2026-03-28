import { APP_TEXTS } from "@texts";

import type { RouteContext, Screen } from "@router/Screen";

type AuthSubmitHandler = (form: HTMLFormElement) => void | Promise<void>;

interface AuthPageViewOptions {
  documentTitle: string;
  render: () => string;
  onSubmit?: AuthSubmitHandler;
}

export class AuthPageView implements Screen {
  private _root?: HTMLElement;
  private _form?: HTMLFormElement;
  private _openAnimationFrame?: number;
  private _passwordToggleButtons: HTMLButtonElement[] = [];

  constructor(private readonly _options: AuthPageViewOptions) {}

  public mount(container: HTMLElement): void {
    const htmlHost = document.createElement("div");
    htmlHost.innerHTML = this._options.render();
    this._root = htmlHost.firstElementChild as HTMLElement;
    container.replaceChildren(this._root);
    this._form = this._root.querySelector<HTMLFormElement>(".auth-form") ?? undefined;
    this._passwordToggleButtons = Array.from(this._root.querySelectorAll<HTMLButtonElement>("[data-password-toggle]"));
    this._syncPasswordToggleButtons();
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

    for (const button of this._passwordToggleButtons) {
      button.addEventListener("click", this._onPasswordToggleClick);
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

    for (const button of this._passwordToggleButtons) {
      button.removeEventListener("click", this._onPasswordToggleClick);
    }
  }

  public destroy(): void {
    if (this._openAnimationFrame !== undefined) {
      cancelAnimationFrame(this._openAnimationFrame);
      this._openAnimationFrame = undefined;
    }

    this._form = undefined;
    this._passwordToggleButtons = [];
    this._root = undefined;
  }

  private _syncPasswordToggleButtons(): void {
    for (const button of this._passwordToggleButtons) {
      const input = this._resolvePasswordToggleInput(button);
      if (!input) {
        continue;
      }

      this._syncPasswordToggleButton(button, input);
    }
  }

  private _resolvePasswordToggleInput(button: HTMLButtonElement): HTMLInputElement | null {
    const shell = button.closest<HTMLElement>("[data-password-field]");
    return shell?.querySelector<HTMLInputElement>('input[type="password"], input[type="text"]') ?? null;
  }

  private _syncPasswordToggleButton(button: HTMLButtonElement, input: HTMLInputElement): void {
    const isVisible = input.type === "text";
    const label = isVisible ? (button.dataset.hideLabel ?? "Hide value") : (button.dataset.showLabel ?? "Show value");

    button.dataset.passwordVisible = isVisible ? "true" : "false";
    button.setAttribute("aria-label", label);
    button.title = label;
  }

  private _onPasswordToggleClick = (event: Event): void => {
    const button = event.currentTarget;
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const input = this._resolvePasswordToggleInput(button);
    if (!input) {
      return;
    }

    input.type = input.type === "password" ? "text" : "password";
    this._syncPasswordToggleButton(button, input);
    input.focus({ preventScroll: true });
  };

  private _onSubmit = (event: Event): void => {
    event.preventDefault();

    if (!this._form) {
      return;
    }

    void this._options.onSubmit?.(this._form);
  };
}
