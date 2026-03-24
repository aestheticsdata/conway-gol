import type { AppPath } from "@app/navigation/NavigationAdapter";

export type RouteContext = {
  path: AppPath;
  url: URL;
  query: URLSearchParams;
};

export interface Screen {
  mount(container: HTMLElement): void;
  enter(context: RouteContext): void | Promise<void>;
  leave(): void;
  destroy?(): void;
}
