import { CLOSE_ICON } from "@assets/icons/closeIcon";
import { HEART_ICON } from "@assets/icons/heartIcon";
import { PERSON_ICON } from "@assets/icons/personIcon";
import { extractHxfPatternCardMeta } from "@data/patterns/patternCardMeta";
import PatternFavoriteService from "@services/PatternFavoriteService";
import PatternService, { type RemotePattern } from "@services/PatternService";
import { APP_TEXTS } from "@texts";
import { createLinkButtonElement } from "@ui/components/button/createButton";
import { drawPatternPreview, normalizePatternPreviewSource } from "@ui/lib/patternPreview";

import type { PatternCardLink } from "@data/patterns/patternCardMeta";

type ZooPatternModalOptions = {
  onSelect: (patternName: string) => void;
  patterns: string[];
  selectedPattern: string;
};

type PatternCardMeta = {
  author: string;
  description: string;
  displayName: string;
  links: PatternCardLink[];
  pattern: number[][];
};

type PatternCardRecord = {
  author: HTMLElement;
  card: HTMLElement;
  count: HTMLElement;
  favoriteButton: HTMLButtonElement;
  links: HTMLElement;
  preview: HTMLCanvasElement;
  previewPlaceholder: HTMLElement;
  title: HTMLElement;
  description: HTMLElement;
  loaded: boolean;
  meta: PatternCardMeta | null;
  loadingPromise: Promise<void> | null;
};

type CardEntranceSource = "initial" | "scroll";

type CardMotionOptions = {
  baseDelayMs?: number;
  delayScale?: number;
  fadeScale?: number;
  moveScale?: number;
  shiftScale?: number;
  waveScale?: number;
};

const PREVIEW_WIDTH = 320;
const PREVIEW_HEIGHT = 188;
const CARD_STAGGER_STEP_MS = 34;
const CARD_STAGGER_WAVE_MS = 7;
const CARD_STAGGER_MAX_INDEX = 7;
const CARD_FADE_DURATION_MS = 280;
const CARD_FADE_DURATION_VARIATION_MS = 18;
const CARD_MOVE_DURATION_MS = 430;
const CARD_MOVE_DURATION_VARIATION_MS = 24;
const CARD_SHIFT_PX = 20;
const CARD_SHIFT_VARIATION_PX = 4;
const CARD_INITIAL_REVEAL_DELAY_MS = 96;
const CARD_INITIAL_FADE_SCALE = 1.75;
const CARD_SCROLL_FADE_SLOW_SCALE = 1.56;
const CARD_SCROLL_FADE_FAST_SCALE = 1.28;
const CARD_SCROLL_MOVE_SLOW_SCALE = 0.92;
const CARD_SCROLL_MOVE_FAST_SCALE = 0.72;
const CARD_SCROLL_SHIFT_SLOW_SCALE = 0.98;
const CARD_SCROLL_SHIFT_FAST_SCALE = 0.82;
const CARD_LOAD_AHEAD_ROOT_MARGIN = "180px 0px 220px 0px";
const CARD_REVEAL_ROOT_MARGIN = "0px 0px -18% 0px";
const CARD_REVEAL_MIN_VISIBLE_RATIO = 0.38;
const CARD_REVEAL_THRESHOLDS = Array.from({ length: 21 }, (_, index) => index / 20);
const CARD_REVEAL_ROW_TOLERANCE_PX = 6;
const SCROLL_REVEAL_MIN_LEAD_PX = 40;
const SCROLL_REVEAL_MAX_LEAD_PX = 96;
const SCROLL_REVEAL_TOP_INSET_PX = 16;
const SCROLL_VELOCITY_MAX_PX_PER_MS = 1.6;

function applyCardMotion(
  card: HTMLElement,
  index: number,
  options?: CardMotionOptions,
): { delay: number; fadeDuration: number; moveDuration: number } {
  const cappedIndex = Math.min(index, CARD_STAGGER_MAX_INDEX);
  const baseDelayMs = options?.baseDelayMs ?? 0;
  const delayScale = options?.delayScale ?? 1;
  const fadeScale = options?.fadeScale ?? 1;
  const moveScale = options?.moveScale ?? 1;
  const shiftScale = options?.shiftScale ?? 1;
  const waveScale = options?.waveScale ?? delayScale;
  const delay = Math.round(
    baseDelayMs +
      cappedIndex * CARD_STAGGER_STEP_MS * delayScale +
      (cappedIndex % 3) * CARD_STAGGER_WAVE_MS * waveScale,
  );
  const fadeDuration = Math.round(
    (CARD_FADE_DURATION_MS + (cappedIndex % 3) * CARD_FADE_DURATION_VARIATION_MS) * fadeScale,
  );
  const moveDuration = Math.round(
    (CARD_MOVE_DURATION_MS + (cappedIndex % 4) * CARD_MOVE_DURATION_VARIATION_MS) * moveScale,
  );
  const shift = Math.round((CARD_SHIFT_PX + (cappedIndex % 4) * CARD_SHIFT_VARIATION_PX) * shiftScale);

  card.style.setProperty("--zoo-pattern-card-delay", `${delay}ms`);
  card.style.setProperty("--zoo-pattern-card-fade-duration", `${fadeDuration}ms`);
  card.style.setProperty("--zoo-pattern-card-move-duration", `${moveDuration}ms`);
  card.style.setProperty("--zoo-pattern-card-shift", `${shift}px`);
  return { delay, fadeDuration, moveDuration };
}

function extractPatternMeta(patternName: string, remotePattern: RemotePattern): PatternCardMeta {
  return extractHxfPatternCardMeta({
    patternName,
    remotePattern,
    fallbackAuthor: APP_TEXTS.zoo.unknownAuthor,
    fallbackDescription: APP_TEXTS.zoo.fallbackDescription,
  });
}

class ZooPatternModal {
  private readonly _overlay: HTMLDivElement;
  private readonly _closeButton: HTMLButtonElement;
  private readonly _body: HTMLElement;
  private readonly _searchInput: HTMLInputElement;
  private readonly _resultsGrid: HTMLElement;
  private readonly _emptyState: HTMLElement;
  private readonly _favoriteService = new PatternFavoriteService();
  private readonly _patternService = new PatternService();
  private readonly _cardRecords = new Map<string, PatternCardRecord>();
  private _patternNames: string[] = [];
  private _selectedPattern = "";
  private _onSelect: ((patternName: string) => void) | null = null;
  private _previouslyFocused: HTMLElement | null = null;
  private _bodyOverflow = "";
  private _loadObserver: IntersectionObserver | null = null;
  private _revealObserver: IntersectionObserver | null = null;
  private _lastBodyScrollTop = 0;
  private _lastBodyScrollAt = 0;
  private _scrollVelocityPxPerMs = 0;
  private _scrollRevealFrameId = 0;
  private _hasBodyScrolled = false;
  private _isOpen = false;

  constructor(root: HTMLElement = document.body) {
    this._overlay = document.createElement("div");
    this._overlay.className = "ui-save-modal zoo-pattern-modal";
    this._overlay.hidden = true;
    this._overlay.innerHTML = `
      <div class="ui-save-modal__backdrop zoo-pattern-modal__backdrop"></div>
      <section
        class="ui-save-modal__dialog zoo-pattern-modal__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="zoo-pattern-modal-title"
      >
        <div class="zoo-pattern-modal__header">
          <div class="zoo-pattern-modal__heading">
            <h2 id="zoo-pattern-modal-title" class="zoo-pattern-modal__title">${APP_TEXTS.zoo.patternListsTitle}</h2>
          </div>
          <div class="zoo-pattern-modal__header-actions">
            <input
              type="search"
              class="ui-input zoo-pattern-modal__search"
              placeholder="${APP_TEXTS.zoo.searchPlaceholder}"
              aria-label="${APP_TEXTS.zoo.searchPlaceholder}"
            >
            <button type="button" class="zoo-pattern-modal__close" aria-label="${APP_TEXTS.zoo.closePatternLists}">
              <span aria-hidden="true">${CLOSE_ICON}</span>
            </button>
          </div>
        </div>
        <div class="zoo-pattern-modal__body">
          <div class="zoo-pattern-modal__grid"></div>
          <p class="zoo-pattern-modal__empty" hidden>${APP_TEXTS.zoo.emptySearch}</p>
        </div>
      </section>
    `;

    this._closeButton = this._query(".zoo-pattern-modal__close");
    this._body = this._query(".zoo-pattern-modal__body");
    this._searchInput = this._query(".zoo-pattern-modal__search");
    this._resultsGrid = this._query(".zoo-pattern-modal__grid");
    this._emptyState = this._query(".zoo-pattern-modal__empty");

    this._overlay.addEventListener("click", this._handleOverlayClick);
    this._closeButton.addEventListener("click", this._handleCloseButtonClick);
    this._searchInput.addEventListener("input", this._handleSearchInput);

    root.append(this._overlay);
  }

  public open(options: ZooPatternModalOptions): void {
    this._patternNames = [...options.patterns];
    this._selectedPattern = options.selectedPattern;
    this._onSelect = options.onSelect;
    this._previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this._searchInput.value = "";
    this._isOpen = true;
    this._syncOverlayInset();
    this._resetBodyScroll();
    this._renderPatternGrid();
    this._overlay.hidden = false;
    this._overlay.classList.remove("is-closing");
    this._resetBodyScroll();

    this._bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    document.addEventListener("keydown", this._handleDocumentKeyDown);
    this._body.addEventListener("scroll", this._handleBodyScroll, { passive: true });
    window.addEventListener("resize", this._syncOverlayInset);
    window.addEventListener("scroll", this._syncOverlayInset, true);

    requestAnimationFrame(() => {
      this._resetBodyScroll();
      this._overlay.classList.add("is-open");
      requestAnimationFrame(() => {
        this._resetBodyScroll();
      });
      this._searchInput.focus();
    });
  }

  public close(options?: { restoreFocus?: boolean }): void {
    const restoreFocus = options?.restoreFocus ?? true;

    if (!this._isOpen && this._overlay.hidden) {
      if (restoreFocus) {
        this._previouslyFocused?.focus();
      }
      return;
    }

    this._isOpen = false;
    this._overlay.classList.remove("is-open");
    this._overlay.classList.add("is-closing");
    document.removeEventListener("keydown", this._handleDocumentKeyDown);
    this._body.removeEventListener("scroll", this._handleBodyScroll);
    window.removeEventListener("resize", this._syncOverlayInset);
    window.removeEventListener("scroll", this._syncOverlayInset, true);
    document.body.style.overflow = this._bodyOverflow;
    if (this._scrollRevealFrameId !== 0) {
      window.cancelAnimationFrame(this._scrollRevealFrameId);
      this._scrollRevealFrameId = 0;
    }
    this._loadObserver?.disconnect();
    this._revealObserver?.disconnect();

    let finished = false;
    const finish = (): void => {
      if (finished) {
        return;
      }

      finished = true;
      this._overlay.hidden = true;
      this._overlay.classList.remove("is-closing");
      this._resetBodyScroll();
      if (restoreFocus) {
        this._previouslyFocused?.focus();
      }
    };

    this._overlay.addEventListener("animationend", finish, { once: true });
    window.setTimeout(finish, 220);
  }

  public destroy(): void {
    this._loadObserver?.disconnect();
    this._revealObserver?.disconnect();
    document.removeEventListener("keydown", this._handleDocumentKeyDown);
    this._body.removeEventListener("scroll", this._handleBodyScroll);
    window.removeEventListener("resize", this._syncOverlayInset);
    window.removeEventListener("scroll", this._syncOverlayInset, true);
    if (this._scrollRevealFrameId !== 0) {
      window.cancelAnimationFrame(this._scrollRevealFrameId);
      this._scrollRevealFrameId = 0;
    }
    this._overlay.removeEventListener("click", this._handleOverlayClick);
    this._closeButton.removeEventListener("click", this._handleCloseButtonClick);
    this._searchInput.removeEventListener("input", this._handleSearchInput);
    this._overlay.remove();
  }

  private _query<T extends HTMLElement>(selector: string): T {
    const node = this._overlay.querySelector(selector);
    if (!(node instanceof HTMLElement)) {
      throw new Error(`Missing zoo modal element: ${selector}`);
    }

    return node as T;
  }

  private _handleOverlayClick = (event: MouseEvent): void => {
    const target = event.target;
    if (
      target === this._overlay ||
      (target instanceof HTMLElement && target.classList.contains("ui-save-modal__backdrop"))
    ) {
      this.close();
    }
  };

  private _handleCloseButtonClick = (): void => {
    this.close();
  };

  private _handleSearchInput = (): void => {
    this._renderPatternGrid();
  };

  private _handleBodyScroll = (): void => {
    const now = performance.now();
    const nextScrollTop = this._body.scrollTop;
    const distance = Math.abs(nextScrollTop - this._lastBodyScrollTop);
    const elapsed = Math.max(now - this._lastBodyScrollAt, 1);
    const instantaneousVelocity = distance / elapsed;

    this._scrollVelocityPxPerMs =
      this._lastBodyScrollAt === 0
        ? instantaneousVelocity
        : instantaneousVelocity * 0.72 + this._scrollVelocityPxPerMs * 0.28;
    this._lastBodyScrollTop = nextScrollTop;
    this._lastBodyScrollAt = now;
    this._hasBodyScrolled ||= distance > 0.5;

    if (this._scrollRevealFrameId !== 0) {
      return;
    }

    this._scrollRevealFrameId = window.requestAnimationFrame(() => {
      this._scrollRevealFrameId = 0;
      this._revealRowsNearViewport();
    });
  };

  private _handleDocumentKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      this.close({ restoreFocus: false });
    }
  };

  private _syncOverlayInset = (): void => {
    const header = document.querySelector<HTMLElement>(".workspace-header");
    const topInset = header ? Math.max(20, Math.round(header.getBoundingClientRect().bottom) + 12) : 20;
    this._overlay.style.setProperty("--zoo-pattern-modal-top", `${topInset}px`);
  };

  private _resetBodyScroll(): void {
    this._body.scrollTop = 0;
    this._body.scrollLeft = 0;
    this._body.scrollTo?.({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    this._lastBodyScrollTop = 0;
    this._lastBodyScrollAt = performance.now();
    this._scrollVelocityPxPerMs = 0;
    this._hasBodyScrolled = false;
  }

  private _renderPatternGrid(): void {
    const query = this._searchInput.value.trim().toLowerCase();
    const matches = this._patternNames.filter((patternName) => this._matchesQuery(patternName, query));

    this._emptyState.hidden = matches.length > 0;

    const fragment = document.createDocumentFragment();
    for (const [index, patternName] of matches.entries()) {
      const record = this._getOrCreateCard(patternName);
      record.card.classList.toggle("is-selected", patternName === this._selectedPattern);
      record.card.classList.remove("is-animating", "is-entered");
      record.card.dataset.renderIndex = String(index);
      applyCardMotion(record.card, index);
      this._syncFavoriteState(record, patternName);
      fragment.append(record.card);
    }

    this._resultsGrid.replaceChildren(fragment);
    this._resetObserver(matches);
  }

  private _matchesQuery(patternName: string, query: string): boolean {
    if (!query) {
      return true;
    }

    const record = this._cardRecords.get(patternName);
    const values = [
      patternName,
      record?.meta?.displayName ?? "",
      record?.meta?.author ?? "",
      record?.meta?.description ?? "",
    ];

    return values.some((value) => value.toLowerCase().includes(query));
  }

  private _resetObserver(patternNames: string[]): void {
    this._loadObserver?.disconnect();
    this._revealObserver?.disconnect();

    if (typeof window.IntersectionObserver !== "function") {
      for (const [index, patternName] of patternNames.entries()) {
        const record = this._cardRecords.get(patternName);
        if (!record) {
          continue;
        }

        this._startCardEntrance(record.card, index);
        void this._ensureCardLoaded(patternName, record);
      }
      return;
    }

    this._loadObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }

          const card = entry.target;
          if (!(card instanceof HTMLElement)) {
            continue;
          }

          const patternName = card.dataset.patternName;
          if (!patternName) {
            continue;
          }

          const record = this._cardRecords.get(patternName);
          if (!record) {
            continue;
          }

          void this._ensureCardLoaded(patternName, record);
          this._loadObserver?.unobserve(card);
        }
      },
      {
        root: this._body,
        rootMargin: CARD_LOAD_AHEAD_ROOT_MARGIN,
        threshold: 0,
      },
    );

    this._revealObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter(
            (entry) =>
              entry.isIntersecting &&
              this._isEntryVisibleEnough(entry) &&
              entry.target instanceof HTMLElement &&
              !entry.target.classList.contains("is-entered"),
          )
          .sort((left, right) => {
            const leftIndex = Number((left.target as HTMLElement).dataset.renderIndex ?? "0");
            const rightIndex = Number((right.target as HTMLElement).dataset.renderIndex ?? "0");
            return leftIndex - rightIndex;
          });

        const revealedRowTops: number[] = [];
        for (const entry of visibleEntries) {
          const card = entry.target;
          if (!(card instanceof HTMLElement)) {
            continue;
          }

          if (revealedRowTops.some((rowTop) => Math.abs(rowTop - card.offsetTop) <= CARD_REVEAL_ROW_TOLERANCE_PX)) {
            continue;
          }

          this._revealRow(card, this._hasBodyScrolled ? "scroll" : "initial");
          revealedRowTops.push(card.offsetTop);
        }
      },
      {
        root: this._body,
        rootMargin: CARD_REVEAL_ROOT_MARGIN,
        threshold: CARD_REVEAL_THRESHOLDS,
      },
    );

    for (const patternName of patternNames) {
      const record = this._cardRecords.get(patternName);
      if (record) {
        this._loadObserver.observe(record.card);
        this._revealObserver.observe(record.card);
      }
    }
  }

  private _isEntryVisibleEnough(entry: IntersectionObserverEntry): boolean {
    const { boundingClientRect, rootBounds } = entry;
    if (!rootBounds || boundingClientRect.height <= 0) {
      return entry.intersectionRatio >= CARD_REVEAL_MIN_VISIBLE_RATIO;
    }

    const safeInset = Math.min(24, rootBounds.height * 0.06);
    const revealLine = boundingClientRect.top + Math.min(boundingClientRect.height * CARD_REVEAL_MIN_VISIBLE_RATIO, 96);
    return (
      revealLine <= rootBounds.bottom - safeInset &&
      boundingClientRect.bottom >= rootBounds.top + safeInset &&
      entry.intersectionRatio >= 0.08
    );
  }

  private _revealRowsNearViewport(): void {
    if (!this._hasBodyScrolled) {
      return;
    }

    const viewportTop = this._body.scrollTop;
    const viewportBottom = viewportTop + this._body.clientHeight;
    const revealLead = this._getScrollRevealLeadPx();
    const processedRowTops: number[] = [];
    const rowCandidates = Array.from(this._resultsGrid.querySelectorAll<HTMLElement>(".zoo-pattern-card"))
      .filter((card) => !card.classList.contains("is-entered"))
      .sort((left, right) => {
        const topDelta = left.offsetTop - right.offsetTop;
        if (Math.abs(topDelta) > CARD_REVEAL_ROW_TOLERANCE_PX) {
          return topDelta;
        }

        const leftIndex = Number(left.dataset.renderIndex ?? "0");
        const rightIndex = Number(right.dataset.renderIndex ?? "0");
        return leftIndex - rightIndex;
      });

    for (const card of rowCandidates) {
      if (processedRowTops.some((rowTop) => Math.abs(rowTop - card.offsetTop) <= CARD_REVEAL_ROW_TOLERANCE_PX)) {
        continue;
      }

      const rowTop = card.offsetTop;
      const rowBottom = rowTop + card.offsetHeight;
      if (rowTop > viewportBottom + revealLead || rowBottom < viewportTop - SCROLL_REVEAL_TOP_INSET_PX) {
        continue;
      }

      this._revealRow(card, "scroll");
      processedRowTops.push(rowTop);
    }
  }

  private _revealRow(referenceCard: HTMLElement, source: CardEntranceSource = "initial"): void {
    const rowTop = referenceCard.offsetTop;
    const rowCards = Array.from(this._resultsGrid.querySelectorAll<HTMLElement>(".zoo-pattern-card"))
      .filter(
        (card) =>
          !card.classList.contains("is-entered") && Math.abs(card.offsetTop - rowTop) <= CARD_REVEAL_ROW_TOLERANCE_PX,
      )
      .sort((left, right) => {
        const leftIndex = Number(left.dataset.renderIndex ?? "0");
        const rightIndex = Number(right.dataset.renderIndex ?? "0");
        return leftIndex - rightIndex;
      });

    for (const [batchIndex, card] of rowCards.entries()) {
      const patternName = card.dataset.patternName;
      if (!patternName) {
        continue;
      }

      const record = this._cardRecords.get(patternName);
      if (!record) {
        continue;
      }

      this._startCardEntrance(card, batchIndex, source);
      void this._ensureCardLoaded(patternName, record);
      this._revealObserver?.unobserve(card);
    }
  }

  private _getScrollRevealLeadPx(): number {
    const age = performance.now() - this._lastBodyScrollAt;
    const velocity = age > 160 ? 0 : this._scrollVelocityPxPerMs;
    const normalizedVelocity = Math.min(1, velocity / SCROLL_VELOCITY_MAX_PX_PER_MS);
    return Math.round(
      SCROLL_REVEAL_MIN_LEAD_PX + (SCROLL_REVEAL_MAX_LEAD_PX - SCROLL_REVEAL_MIN_LEAD_PX) * normalizedVelocity,
    );
  }

  private _getOrCreateCard(patternName: string): PatternCardRecord {
    const existing = this._cardRecords.get(patternName);
    if (existing) {
      return existing;
    }

    const card = document.createElement("article");
    card.className = "zoo-pattern-card";
    card.tabIndex = 0;
    card.dataset.patternName = patternName;
    card.setAttribute("role", "button");

    const preview = document.createElement("canvas");
    preview.className = "zoo-pattern-card__preview-canvas";
    preview.width = PREVIEW_WIDTH;
    preview.height = PREVIEW_HEIGHT;

    const previewPlaceholder = document.createElement("div");
    previewPlaceholder.className = "zoo-pattern-card__preview-placeholder";
    previewPlaceholder.textContent = patternName;

    const previewFrame = document.createElement("div");
    previewFrame.className = "zoo-pattern-card__preview";
    previewFrame.append(preview, previewPlaceholder);

    const title = document.createElement("h3");
    title.className = "zoo-pattern-card__title";
    title.textContent = patternName;

    const description = document.createElement("p");
    description.className = "zoo-pattern-card__description";
    description.textContent = APP_TEXTS.zoo.loadingDescription;

    const author = document.createElement("span");
    author.className = "zoo-pattern-card__author";
    author.textContent = APP_TEXTS.zoo.unknownAuthor;

    const authorIcon = document.createElement("span");
    authorIcon.className = "zoo-pattern-card__author-icon";
    authorIcon.setAttribute("aria-hidden", "true");
    authorIcon.innerHTML = PERSON_ICON;

    const authorMeta = document.createElement("div");
    authorMeta.className = "zoo-pattern-card__author-meta";
    authorMeta.append(authorIcon, author);

    const links = document.createElement("div");
    links.className = "zoo-pattern-card__links";
    links.hidden = true;
    links.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    const favoriteButton = document.createElement("button");
    favoriteButton.type = "button";
    favoriteButton.className = "zoo-pattern-card__favorite";
    favoriteButton.innerHTML = `
      <span class="zoo-pattern-card__favorite-icon" aria-hidden="true">${HEART_ICON}</span>
      <span class="zoo-pattern-card__favorite-count"></span>
    `;

    const count = favoriteButton.querySelector(".zoo-pattern-card__favorite-count");
    if (!(count instanceof HTMLElement)) {
      throw new Error("Missing zoo favorite count element.");
    }

    const footer = document.createElement("div");
    footer.className = "zoo-pattern-card__footer";
    footer.append(authorMeta, favoriteButton);

    const body = document.createElement("div");
    body.className = "zoo-pattern-card__body";
    body.append(title, description, links, footer);

    card.append(previewFrame, body);

    card.addEventListener("click", () => {
      this._selectedPattern = patternName;
      this.close({ restoreFocus: false });
      this._onSelect?.(patternName);
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        card.click();
      }
    });
    favoriteButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this._favoriteService.toggleFavorite(patternName);
      this._syncFavoriteState(record, patternName);
    });

    const record: PatternCardRecord = {
      author,
      card,
      count,
      favoriteButton,
      links,
      preview,
      previewPlaceholder,
      title,
      description,
      loaded: false,
      loadingPromise: null,
      meta: null,
    };

    this._syncFavoriteState(record, patternName);
    this._cardRecords.set(patternName, record);
    return record;
  }

  private _getScrollMotionProfile(): {
    delayScale: number;
    fadeScale: number;
    moveScale: number;
    shiftScale: number;
    waveScale: number;
  } {
    const age = performance.now() - this._lastBodyScrollAt;
    const velocity = age > 160 ? 0 : this._scrollVelocityPxPerMs;
    const normalizedVelocity = Math.min(1, velocity / SCROLL_VELOCITY_MAX_PX_PER_MS);

    return {
      delayScale: 0.2 + normalizedVelocity * 0.22,
      fadeScale:
        CARD_SCROLL_FADE_SLOW_SCALE + normalizedVelocity * (CARD_SCROLL_FADE_FAST_SCALE - CARD_SCROLL_FADE_SLOW_SCALE),
      moveScale:
        CARD_SCROLL_MOVE_SLOW_SCALE + normalizedVelocity * (CARD_SCROLL_MOVE_FAST_SCALE - CARD_SCROLL_MOVE_SLOW_SCALE),
      shiftScale:
        CARD_SCROLL_SHIFT_SLOW_SCALE +
        normalizedVelocity * (CARD_SCROLL_SHIFT_FAST_SCALE - CARD_SCROLL_SHIFT_SLOW_SCALE),
      waveScale: 0.24 + normalizedVelocity * 0.18,
    };
  }

  private _getInitialMotionProfile(): CardMotionOptions {
    return {
      baseDelayMs: CARD_INITIAL_REVEAL_DELAY_MS,
      fadeScale: CARD_INITIAL_FADE_SCALE,
    };
  }

  private _startCardEntrance(card: HTMLElement, index: number, source: CardEntranceSource = "initial"): void {
    const existingTimeoutId = Number(card.dataset.animationTimeoutId ?? "0");
    if (existingTimeoutId > 0) {
      window.clearTimeout(existingTimeoutId);
    }

    const motionOptions = source === "scroll" ? this._getScrollMotionProfile() : this._getInitialMotionProfile();
    const { delay, fadeDuration, moveDuration } = applyCardMotion(card, index, motionOptions);
    card.classList.add("is-entered", "is-animating");

    const timeoutId = window.setTimeout(
      () => {
        card.classList.remove("is-animating");
        delete card.dataset.animationTimeoutId;
      },
      delay + Math.max(fadeDuration, moveDuration) + 32,
    );

    card.dataset.animationTimeoutId = String(timeoutId);
  }

  private async _ensureCardLoaded(patternName: string, record: PatternCardRecord): Promise<void> {
    if (record.loaded) {
      return;
    }

    if (record.loadingPromise) {
      return record.loadingPromise;
    }

    record.loadingPromise = this._patternService
      .getPattern(patternName)
      .then((remotePattern) => {
        const meta = extractPatternMeta(patternName, remotePattern);
        record.meta = meta;
        record.loaded = true;
        record.title.textContent = meta.displayName;
        record.description.textContent = meta.description;
        record.author.textContent = meta.author;
        this._renderLinks(record.links, meta.links);
        record.previewPlaceholder.hidden = true;
        drawPatternPreview(
          record.preview,
          normalizePatternPreviewSource({
            kind: "grid",
            pattern: meta.pattern,
          }),
        );
      })
      .catch(() => {
        record.loaded = true;
        record.meta = {
          author: APP_TEXTS.zoo.unknownAuthor,
          description: APP_TEXTS.zoo.fallbackDescription,
          displayName: patternName,
          links: [],
          pattern: [],
        };
        record.description.textContent = APP_TEXTS.zoo.fallbackDescription;
        record.author.textContent = APP_TEXTS.zoo.unknownAuthor;
        this._renderLinks(record.links, []);
      })
      .finally(() => {
        record.loadingPromise = null;
      });

    return record.loadingPromise;
  }

  private _renderLinks(container: HTMLElement, links: PatternCardLink[]): void {
    if (links.length === 0) {
      container.replaceChildren();
      container.hidden = true;
      return;
    }

    const fragment = document.createDocumentFragment();
    for (const link of links) {
      const anchor = createLinkButtonElement({
        className: "zoo-pattern-card__link",
        href: link.href,
        label: link.label,
        target: "_blank",
        title: link.title,
      });
      fragment.append(anchor);
    }

    container.replaceChildren(fragment);
    container.hidden = false;
  }

  private _syncFavoriteState(record: PatternCardRecord, patternName: string): void {
    const isFavorite = this._favoriteService.isFavorite(patternName);
    const count = this._favoriteService.getFavoriteCount(patternName);
    record.favoriteButton.classList.toggle("is-favorite", isFavorite);
    record.favoriteButton.setAttribute("aria-pressed", String(isFavorite));
    record.favoriteButton.setAttribute(
      "aria-label",
      `${APP_TEXTS.zoo.favoriteLabel}: ${patternName}. ${APP_TEXTS.zoo.favoriteCountLabel}: ${count}.`,
    );
    record.count.textContent = String(count);
  }
}

export default ZooPatternModal;
