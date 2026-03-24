import type { NavigationAdapter, AppPath } from "@app/navigation/NavigationAdapter";
import type { RouteContext, Screen } from "./Screen";
import { normalizeAppPath } from "./paths";

export type RouteDefinition = {
  path: AppPath;
  create: () => Screen;
};

export class AppRouter {
  private readonly _routes = new Map<AppPath, RouteDefinition>();
  private _currentScreen?: Screen;
  private _renderToken = 0;

  constructor(
    private readonly _outlet: HTMLElement,
    private readonly _navigation: NavigationAdapter,
    routes: RouteDefinition[],
    private readonly _fallbackPath: AppPath,
  ) {
    routes.forEach((route) => {
      this._routes.set(normalizeAppPath(route.path), route);
    });
  }

  public async start(): Promise<void> {
    this._navigation.start((path, url) => this._render(path, url));
    await this._render(this._navigation.currentPath(), this._navigation.currentUrl());
  }

  public navigate(path: AppPath, options?: { replace?: boolean; state?: unknown }): Promise<void> {
    return this._navigation.navigate(normalizeAppPath(path), options);
  }

  public replace(path: AppPath, state?: unknown): Promise<void> {
    return this._navigation.replace(normalizeAppPath(path), state);
  }

  public dispose(): void {
    this._currentScreen?.leave();
    this._currentScreen?.destroy?.();
    this._navigation.dispose();
  }

  private async _render(path: AppPath, url: URL): Promise<void> {
    const normalizedPath = normalizeAppPath(path);

    if (normalizedPath === "/") {
      await this.replace(this._fallbackPath);
      return;
    }

    const route = this._routes.get(normalizedPath);
    if (!route) {
      await this.replace(this._fallbackPath);
      return;
    }

    const token = ++this._renderToken;
    const nextScreen = route.create();

    this._currentScreen?.leave();
    this._currentScreen?.destroy?.();
    this._outlet.replaceChildren();

    nextScreen.mount(this._outlet);
    this._currentScreen = nextScreen;

    const context: RouteContext = {
      path: normalizedPath,
      url,
      query: url.searchParams,
    };

    await nextScreen.enter(context);

    if (token !== this._renderToken) {
      nextScreen.leave();
      nextScreen.destroy?.();
    }
  }
}
