import { CLOSE_ICON } from "@assets/icons/closeIcon";
import { CONTROL_TEXTS } from "@ui/controls/drawing/texts";

const HXF_IMPORT_AUTO_CLOSE_DURATION_MS = 3000;

/** Full-screen overlay: spinner while saving, then “Import complete” + manual close (X). */
class HxfImportSavingOverlay {
  private readonly _overlay: HTMLDivElement;
  private readonly _panel: HTMLElement;
  private readonly _closeBtn: HTMLButtonElement;
  private readonly _loadingBlock: HTMLElement;
  private readonly _resultBlock: HTMLElement;
  private readonly _messageEl: HTMLElement;
  private readonly _progressBar: HTMLElement;
  private _autoCloseTimer: number | null = null;

  constructor(root: HTMLElement = document.body) {
    this._overlay = document.createElement("div");
    this._overlay.className = "ui-hxf-saving-overlay";
    this._overlay.hidden = true;
    this._overlay.innerHTML = `
      <div class="ui-hxf-saving-overlay__backdrop" aria-hidden="true"></div>
      <div class="ui-hxf-saving-overlay__panel" role="dialog" aria-modal="true">
        <div class="ui-hxf-saving-overlay__header">
          <button
            type="button"
            class="ui-save-modal__close ui-hxf-saving-overlay__close"
            hidden
            aria-label="${CONTROL_TEXTS.drawing.hxfImportCloseLabel}"
          >
            <span aria-hidden="true">${CLOSE_ICON}</span>
          </button>
        </div>
        <div class="ui-hxf-saving-overlay__body">
          <div class="ui-hxf-saving-overlay__loading">
            <svg
              class="ui-hxf-saving__svg"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle
                class="ui-hxf-saving__track"
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                stroke-opacity="0.14"
                stroke-width="3"
              />
              <circle
                class="ui-hxf-saving__arc"
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-dasharray="31.4 94.2"
              />
            </svg>
            <span class="ui-hxf-saving-overlay__sr">${CONTROL_TEXTS.drawing.hxfImportSavingStatus}</span>
          </div>
          <div class="ui-hxf-saving-overlay__result" hidden>
            <p id="ui-hxf-saving-message" class="ui-hxf-saving-overlay__message"></p>
            <div class="ui-hxf-saving-overlay__progress" aria-hidden="true">
              <span class="ui-hxf-saving-overlay__progress-bar"></span>
            </div>
          </div>
        </div>
      </div>
    `;

    this._panel = this._query(".ui-hxf-saving-overlay__panel");
    this._closeBtn = this._query(".ui-hxf-saving-overlay__close");
    this._loadingBlock = this._query(".ui-hxf-saving-overlay__loading");
    this._resultBlock = this._query(".ui-hxf-saving-overlay__result");
    this._messageEl = this._query(".ui-hxf-saving-overlay__message");
    this._progressBar = this._query(".ui-hxf-saving-overlay__progress-bar");

    this._overlay.style.setProperty("--ui-hxf-saving-autoclose-duration", `${HXF_IMPORT_AUTO_CLOSE_DURATION_MS}ms`);

    this._closeBtn.addEventListener("click", this._handleClose);
    document.addEventListener("keydown", this._handleDocumentKeyDown);

    root.append(this._overlay);
  }

  private _query<T extends HTMLElement>(selector: string): T {
    const node = this._overlay.querySelector(selector);
    if (!node || !(node instanceof HTMLElement)) {
      throw new Error(`Missing overlay element: ${selector}`);
    }
    return node as T;
  }

  /** Show overlay with spinner (saving in progress). */
  public showLoading(): void {
    this._clearAutoCloseTimer();
    this._overlay.classList.add("ui-hxf-saving-overlay--loading");
    this._overlay.classList.remove("ui-hxf-saving-overlay--result");
    this._overlay.setAttribute("aria-busy", "true");
    this._panel.setAttribute("aria-label", CONTROL_TEXTS.drawing.hxfImportSavingStatus);
    this._panel.removeAttribute("aria-labelledby");
    this._loadingBlock.hidden = false;
    this._resultBlock.hidden = true;
    this._closeBtn.hidden = true;
    this._messageEl.textContent = "";
    this._messageEl.classList.remove("ui-hxf-saving-overlay__message--error");
    this._overlay.hidden = false;
  }

  /** Replace spinner with success copy; user must close with X. */
  public showImportComplete(): void {
    this._setResultState(CONTROL_TEXTS.drawing.hxfImportCompleteMessage, false);
  }

  /** Replace spinner with error copy; user must close with X. */
  public showImportFailed(message: string): void {
    this._setResultState(message, true);
  }

  private _setResultState(message: string, isError: boolean): void {
    this._clearAutoCloseTimer();
    this._overlay.classList.remove("ui-hxf-saving-overlay--loading");
    this._overlay.classList.remove("ui-hxf-saving-overlay--result");
    this._overlay.setAttribute("aria-busy", "false");
    this._panel.removeAttribute("aria-label");
    this._panel.setAttribute("aria-labelledby", "ui-hxf-saving-message");
    this._loadingBlock.hidden = true;
    this._resultBlock.hidden = false;
    this._messageEl.textContent = message;
    this._messageEl.classList.toggle("ui-hxf-saving-overlay__message--error", isError);
    this._closeBtn.hidden = false;
    this._restartProgressBar();
    this._overlay.classList.add("ui-hxf-saving-overlay--result");
    this._closeBtn.focus();
    this._scheduleAutoClose();
  }

  private _restartProgressBar(): void {
    this._progressBar.style.animation = "none";
    void this._progressBar.offsetWidth;
    this._progressBar.style.removeProperty("animation");
  }

  private _scheduleAutoClose(): void {
    this._autoCloseTimer = window.setTimeout(() => {
      this._autoCloseTimer = null;
      this.hide();
    }, HXF_IMPORT_AUTO_CLOSE_DURATION_MS);
  }

  private _clearAutoCloseTimer(): void {
    if (this._autoCloseTimer !== null) {
      clearTimeout(this._autoCloseTimer);
      this._autoCloseTimer = null;
    }
  }

  public hide(): void {
    this._clearAutoCloseTimer();
    this._overlay.hidden = true;
    this._overlay.classList.remove("ui-hxf-saving-overlay--loading");
    this._overlay.classList.remove("ui-hxf-saving-overlay--result");
    this._overlay.setAttribute("aria-busy", "false");
    this._panel.removeAttribute("aria-labelledby");
    this._panel.removeAttribute("aria-label");
  }

  private _handleClose = (): void => {
    this.hide();
  };

  private _handleDocumentKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape" || this._overlay.hidden || this._closeBtn.hidden) {
      return;
    }

    event.preventDefault();
    this.hide();
  };

  public destroy(): void {
    this._clearAutoCloseTimer();
    document.removeEventListener("keydown", this._handleDocumentKeyDown);
    this._closeBtn.removeEventListener("click", this._handleClose);
    this._overlay.remove();
  }
}

export default HxfImportSavingOverlay;
