import { CLOSE_ICON } from "@assets/icons/closeIcon";
import { createButton } from "@ui/components/button/createButton";

interface PromptModalTexts {
  description?: string;
  title: string;
  inputPlaceholder: string;
  saveLabel: string;
  cancelLabel: string;
  nameRequired: string;
  closeLabel: string;
}

type PromptModalMode = "notice" | "prompt";

interface PromptModalOptions {
  autocomplete?: HTMLInputElement["autocomplete"];
  hideCancel?: boolean;
  inputType?: "password" | "text";
  /** Prefills the name field (export filename, etc.). */
  initialValue?: string;
  mode?: PromptModalMode;
}

const DEFAULT_TEXTS: PromptModalTexts = {
  description: "",
  title: "Save preset",
  inputPlaceholder: "Preset name",
  saveLabel: "save",
  cancelLabel: "cancel",
  nameRequired: "Name is required",
  closeLabel: "close",
};

class PromptModal {
  private readonly _overlay: HTMLDivElement;
  private readonly _title: HTMLHeadingElement;
  private readonly _description: HTMLParagraphElement;
  private readonly _input: HTMLInputElement;
  private readonly _error: HTMLParagraphElement;
  private readonly _saveBtn: HTMLButtonElement;
  private readonly _cancelBtn: HTMLButtonElement;
  private readonly _closeBtn: HTMLButtonElement;
  private _resolver: ((value: string | null) => void) | null = null;
  private _pendingPromise: Promise<string | null> | null = null;
  private _previouslyFocused: HTMLElement | null = null;
  private _texts: PromptModalTexts = DEFAULT_TEXTS;
  private _mode: PromptModalMode = "prompt";

  constructor(root: HTMLElement = document.body) {
    this._overlay = document.createElement("div");
    this._overlay.className = "ui-save-modal";
    this._overlay.hidden = true;
    this._overlay.innerHTML = `
      <div class="ui-save-modal__backdrop"></div>
      <section class="ui-save-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="ui-save-modal-title">
        <div class="ui-save-modal__header">
          <h2 id="ui-save-modal-title" class="ui-save-modal__title">${DEFAULT_TEXTS.title}</h2>
          <button type="button" class="ui-save-modal__close" aria-label="${DEFAULT_TEXTS.closeLabel}">
            <span aria-hidden="true">${CLOSE_ICON}</span>
          </button>
        </div>
        <p class="ui-save-modal__description" hidden></p>
        <input
          type="text"
          class="ui-input ui-save-modal__input"
          maxlength="64"
          autocomplete="off"
          placeholder="${DEFAULT_TEXTS.inputPlaceholder}"
        >
        <p class="ui-save-modal__error" hidden></p>
        <div class="ui-save-modal__actions">
          ${createButton({ className: "ui-save-modal__cancel", label: DEFAULT_TEXTS.cancelLabel, size: "compact" })}
          ${createButton({ className: "ui-save-modal__save", label: DEFAULT_TEXTS.saveLabel, size: "compact" })}
        </div>
      </section>
    `;

    this._title = this._query(".ui-save-modal__title");
    this._description = this._query(".ui-save-modal__description");
    this._input = this._query(".ui-save-modal__input");
    this._error = this._query(".ui-save-modal__error");
    this._saveBtn = this._query(".ui-save-modal__save");
    this._cancelBtn = this._query(".ui-save-modal__cancel");
    this._closeBtn = this._query(".ui-save-modal__close");

    this._saveBtn.addEventListener("click", this._handleSave);
    this._cancelBtn.addEventListener("click", this._handleCancel);
    this._closeBtn.addEventListener("click", this._handleCancel);
    this._overlay.addEventListener("click", this._handleOverlayClick);
    this._input.addEventListener("keydown", this._handleInputKeyDown);

    root.append(this._overlay);
  }

  public open(texts: Partial<PromptModalTexts> = {}, options: PromptModalOptions = {}): Promise<string | null> {
    if (this._resolver) {
      this._resolver(null);
      this._resolver = null;
    }

    this._texts = {
      ...DEFAULT_TEXTS,
      ...texts,
    };
    this._mode = options.mode ?? "prompt";

    this._previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    this._overlay.hidden = false;
    this._overlay.classList.remove("is-closing");
    requestAnimationFrame(() => {
      this._overlay.classList.add("is-open");
    });

    this._title.textContent = this._texts.title;
    this._description.textContent = this._texts.description ?? "";
    this._description.hidden = (this._texts.description ?? "").length === 0;
    this._input.placeholder = this._texts.inputPlaceholder;
    this._input.type = options.inputType ?? "text";
    this._input.autocomplete = options.autocomplete ?? "off";
    this._saveBtn.textContent = this._texts.saveLabel;
    this._cancelBtn.textContent = this._texts.cancelLabel;
    this._cancelBtn.hidden = options.hideCancel ?? false;
    this._closeBtn.setAttribute("aria-label", this._texts.closeLabel);
    this._input.value = options.initialValue ?? "";
    this._input.hidden = this._mode === "notice";
    this._setError("");
    if (this._mode === "notice") {
      this._saveBtn.focus();
    } else {
      this._input.focus();
    }
    document.addEventListener("keydown", this._handleDocumentKeyDown);

    this._pendingPromise = new Promise<string | null>((resolve) => {
      this._resolver = resolve;
    });

    return this._pendingPromise;
  }

  public destroy(): void {
    document.removeEventListener("keydown", this._handleDocumentKeyDown);
    this._overlay.remove();
    this._resolver = null;
    this._pendingPromise = null;
  }

  public async openNotice(
    texts: Pick<PromptModalTexts, "closeLabel" | "description" | "saveLabel" | "title"> &
      Partial<Pick<PromptModalTexts, "cancelLabel">>,
  ): Promise<void> {
    await this.open(
      {
        cancelLabel: texts.cancelLabel ?? DEFAULT_TEXTS.cancelLabel,
        closeLabel: texts.closeLabel,
        description: texts.description,
        saveLabel: texts.saveLabel,
        title: texts.title,
      },
      {
        hideCancel: true,
        mode: "notice",
      },
    );
  }

  private _query<T extends HTMLElement>(selector: string): T {
    const node = this._overlay.querySelector(selector);
    if (!node || !(node instanceof HTMLElement)) {
      throw new Error(`Missing modal element: ${selector}`);
    }
    return node as T;
  }

  private _handleOverlayClick = (event: MouseEvent): void => {
    if (event.target === this._overlay || (event.target as Element).classList.contains("ui-save-modal__backdrop")) {
      this._close(null);
    }
  };

  private _handleInputKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Enter") {
      event.preventDefault();
      this._handleSave();
    }
  };

  private _handleDocumentKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      this._close(null, { restoreFocus: false });
    }
  };

  private _handleCancel = (): void => {
    this._close(null);
  };

  private _handleSave = (): void => {
    if (this._mode === "notice") {
      this._close("", { restoreFocus: false });
      return;
    }

    const trimmedName = this._input.value.trim();
    if (!trimmedName) {
      this._setError(this._texts.nameRequired);
      return;
    }
    this._setError("");
    this._close(trimmedName, { restoreFocus: false });
  };

  private _setError(message: string): void {
    this._error.textContent = message;
    this._error.hidden = message.length === 0;
  }

  private _close(value: string | null, options?: { restoreFocus?: boolean }): void {
    const shouldRestoreFocus = options?.restoreFocus ?? true;
    const resolve = this._resolver;
    this._resolver = null;
    document.removeEventListener("keydown", this._handleDocumentKeyDown);

    if (this._overlay.hidden) {
      if (resolve) {
        this._pendingPromise = null;
        resolve(value);
      }
      return;
    }

    this._overlay.classList.remove("is-open");
    this._overlay.classList.add("is-closing");

    let didFinish = false;
    const finish = (): void => {
      if (didFinish) {
        return;
      }
      didFinish = true;
      this._overlay.hidden = true;
      this._overlay.classList.remove("is-closing");
      if (this._pendingPromise && resolve) {
        this._pendingPromise = null;
        resolve(value);
      } else {
        this._pendingPromise = null;
      }
      if (shouldRestoreFocus) {
        this._previouslyFocused?.focus();
      }
    };

    this._overlay.addEventListener("animationend", finish, { once: true });
    window.setTimeout(finish, 220);
  }
}

export default PromptModal;
