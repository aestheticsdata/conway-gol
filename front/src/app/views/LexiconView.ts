import { LOGIN_ROUTE } from "@app/routes";
import { LIFE_LEXICON } from "@data/lexicon/lexiconParser";
import SessionService from "@services/SessionService";
import { APP_TEXTS } from "@texts";
import { drawPatternPreview, parseAsciiPattern } from "@ui/lib/patternPreview";
import WorkspaceUserMenu from "@ui/lib/WorkspaceUserMenu";
import { createLexiconView } from "./html/lexiconView";

import type { AppPath } from "@navigation/NavigationAdapter";
import type { RouteContext, Screen } from "@router/Screen";

export class LexiconView implements Screen {
  private _root?: HTMLElement;
  private _userMenu?: WorkspaceUserMenu;
  private readonly _session = new SessionService();
  private _scrollAnimationFrame = 0;

  constructor(private readonly _navigate: (path: AppPath) => Promise<void>) {}

  public mount(container: HTMLElement): void {
    const htmlHost = document.createElement("div");
    htmlHost.innerHTML = createLexiconView(
      this._session.getUsernameOrFallback(),
      this._session.getAvatarIdOrFallback(),
    );
    this._root = htmlHost.firstElementChild as HTMLElement;
    container.replaceChildren(this._root);

    this._userMenu = new WorkspaceUserMenu({
      root: this._root,
      onLogout: this._onLogout,
    });

    this._root.addEventListener("click", this._onRootClick);
    this._renderPatternPreviews();
  }

  public enter(context: RouteContext): void {
    document.title = `${APP_TEXTS.document.title} | ${APP_TEXTS.lexicon.title}`;

    const targetId = context.url.hash ? decodeURIComponent(context.url.hash.slice(1)) : "";
    if (targetId) {
      requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({ block: "start" });
      });
      return;
    }

    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  public leave(): void {}

  public destroy(): void {
    if (this._scrollAnimationFrame !== 0) {
      cancelAnimationFrame(this._scrollAnimationFrame);
      this._scrollAnimationFrame = 0;
    }

    this._root?.removeEventListener("click", this._onRootClick);
    this._userMenu?.destroy();
    this._userMenu = undefined;
    this._root = undefined;
  }

  private _renderPatternPreviews(): void {
    if (!this._root) {
      return;
    }

    for (const entry of LIFE_LEXICON.entries) {
      if (!entry.patternCard) {
        continue;
      }

      const canvas = this._root.querySelector<HTMLCanvasElement>(`[data-lexicon-pattern-anchor="${entry.anchorId}"]`);
      if (!canvas) {
        continue;
      }

      drawPatternPreview(canvas, parseAsciiPattern(entry.patternCard.previewAscii));
    }
  }

  private _onRootClick = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const backToTopLink = target.closest<HTMLElement>("[data-lexicon-back-to-top]");
    if (!backToTopLink) {
      return;
    }

    event.preventDefault();
    this._scrollToTop();
  };

  private _scrollToTop(): void {
    const scrollingElement = document.scrollingElement;
    if (!scrollingElement) {
      window.scrollTo(0, 0);
      return;
    }

    if (this._scrollAnimationFrame !== 0) {
      cancelAnimationFrame(this._scrollAnimationFrame);
      this._scrollAnimationFrame = 0;
    }

    const startTop = scrollingElement.scrollTop;
    if (startTop <= 0) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      scrollingElement.scrollTop = 0;
      return;
    }

    const durationMs = 220;
    const startTime = performance.now();

    const step = (now: number): void => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = 1 - (1 - progress) * (1 - progress);
      scrollingElement.scrollTop = Math.round(startTop * (1 - eased));

      if (progress < 1) {
        this._scrollAnimationFrame = requestAnimationFrame(step);
        return;
      }

      scrollingElement.scrollTop = 0;
      this._scrollAnimationFrame = 0;
    };

    this._scrollAnimationFrame = requestAnimationFrame(step);
  }

  private _onLogout = (): void => {
    this._session.clear();
    void this._navigate(LOGIN_ROUTE);
  };
}
