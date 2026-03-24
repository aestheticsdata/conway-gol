export type AppPath = `/${string}`;

export type NavigationChangeListener = (path: AppPath, url: URL) => void | Promise<void>;

export interface NavigationAdapter {
  currentPath(): AppPath;
  currentUrl(): URL;
  start(listener: NavigationChangeListener): void;
  navigate(path: AppPath, options?: { replace?: boolean; state?: unknown }): Promise<void>;
  replace(path: AppPath, state?: unknown): Promise<void>;
  back(): Promise<void>;
  dispose(): void;
}
