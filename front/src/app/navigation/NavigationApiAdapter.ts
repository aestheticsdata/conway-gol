import { PUBLIC_APP_ROUTES } from "@app/routes";
import { normalizeAppPath, stripBasePath, toDocumentPath } from "@router/paths";

import type { AppPath, NavigationAdapter, NavigationChangeListener } from "@navigation/NavigationAdapter";

type NavigationResult = {
  committed: Promise<unknown>;
  finished: Promise<unknown>;
};

type NavigationApi = EventTarget & {
  navigate(
    url: string,
    options?: {
      history?: "auto" | "push" | "replace";
      state?: unknown;
    },
  ): NavigationResult;
  back(): NavigationResult;
};

type NavigateEventLike = Event & {
  canIntercept: boolean;
  destination: {
    url: string;
  };
  downloadRequest?: unknown;
  formData?: FormData | null;
  hashChange?: boolean;
  intercept(options: {
    handler?: () => void | Promise<void>;
    focusReset?: "after-transition" | "manual";
    scroll?: "after-transition" | "manual";
  }): void;
};

function getNavigationApi(): NavigationApi {
  const navigationApi = (window as Window & { navigation?: NavigationApi }).navigation;
  if (!navigationApi) {
    throw new Error("Navigation API is required for this application");
  }
  return navigationApi;
}

export class NavigationApiAdapter implements NavigationAdapter {
  private readonly _navigation = getNavigationApi();
  private _listener?: NavigationChangeListener;

  constructor(private readonly _basePath: string) {}

  public currentPath(): AppPath {
    return stripBasePath(window.location.pathname, this._basePath);
  }

  public currentUrl(): URL {
    return new URL(window.location.href);
  }

  public start(listener: NavigationChangeListener): void {
    this._listener = listener;
    this._navigation.addEventListener("navigate", this._onNavigate as EventListener);
  }

  public async navigate(path: AppPath, options: { replace?: boolean; state?: unknown } = {}): Promise<void> {
    const result = this._navigation.navigate(this._toDocumentUrl(path), {
      history: options.replace ? "replace" : "push",
      state: options.state,
    });
    await result.finished;
  }

  public replace(path: AppPath, state?: unknown): Promise<void> {
    return this.navigate(path, { replace: true, state });
  }

  public async back(): Promise<void> {
    const result = this._navigation.back();
    await result.finished;
  }

  public dispose(): void {
    this._navigation.removeEventListener("navigate", this._onNavigate as EventListener);
    this._listener = undefined;
  }

  private _onNavigate = (event: NavigateEventLike): void => {
    const url = new URL(event.destination.url);
    const path = stripBasePath(url.pathname, this._basePath);

    if (!this._shouldIntercept(event, url, path)) {
      return;
    }

    event.intercept({
      handler: async () => {
        await this._listener?.(path, url);
      },
      scroll: "manual",
      focusReset: "manual",
    });
  };

  private _shouldIntercept(event: NavigateEventLike, url: URL, path: AppPath): boolean {
    if (!event.canIntercept) {
      return false;
    }

    if (event.hashChange) {
      return false;
    }

    if (event.downloadRequest) {
      return false;
    }

    if (event.formData) {
      return false;
    }

    if (url.origin !== window.location.origin) {
      return false;
    }

    if (
      this._basePath &&
      normalizeAppPath(url.pathname) !== this._basePath &&
      !normalizeAppPath(url.pathname).startsWith(`${this._basePath}/`)
    ) {
      return false;
    }

    return path === "/" || PUBLIC_APP_ROUTES.includes(path);
  }

  private _toDocumentUrl(path: AppPath): string {
    return toDocumentPath(path, this._basePath);
  }
}
