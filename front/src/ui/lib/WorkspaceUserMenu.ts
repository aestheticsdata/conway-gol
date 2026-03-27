import { queryRequired } from "@helpers/dom";

type WorkspaceUserMenuOptions = {
  onLogout: () => void;
  root: HTMLElement;
};

class WorkspaceUserMenu {
  private readonly _root: HTMLElement;
  private readonly _trigger: HTMLButtonElement;
  private readonly _panel: HTMLElement;
  private readonly _logoutButton: HTMLButtonElement;
  private readonly _onLogout: () => void;
  private _isOpen = false;

  constructor(options: WorkspaceUserMenuOptions) {
    this._root = queryRequired<HTMLElement>("[data-workspace-user-menu]", options.root);
    this._trigger = queryRequired<HTMLButtonElement>("[data-workspace-user-menu-trigger]", this._root);
    this._panel = queryRequired<HTMLElement>("[data-workspace-user-menu-panel]", this._root);
    this._logoutButton = queryRequired<HTMLButtonElement>("[data-workspace-logout]", this._root);
    this._onLogout = options.onLogout;

    this._trigger.addEventListener("click", this._handleTriggerClick);
    this._logoutButton.addEventListener("click", this._handleLogoutClick);
    document.addEventListener("pointerdown", this._handleDocumentPointerDown);
    document.addEventListener("keydown", this._handleDocumentKeyDown);
  }

  public destroy(): void {
    this._trigger.removeEventListener("click", this._handleTriggerClick);
    this._logoutButton.removeEventListener("click", this._handleLogoutClick);
    document.removeEventListener("pointerdown", this._handleDocumentPointerDown);
    document.removeEventListener("keydown", this._handleDocumentKeyDown);
  }

  private _handleTriggerClick = (): void => {
    this._setOpen(!this._isOpen);
  };

  private _handleLogoutClick = (): void => {
    this._setOpen(false);
    this._onLogout();
  };

  private _handleDocumentPointerDown = (event: PointerEvent): void => {
    const target = event.target;
    if (!(target instanceof Node) || this._root.contains(target)) {
      return;
    }

    this._setOpen(false);
  };

  private _handleDocumentKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape" || !this._isOpen) {
      return;
    }

    this._setOpen(false);
    this._trigger.focus();
  };

  private _setOpen(open: boolean): void {
    if (this._isOpen === open) {
      return;
    }

    this._isOpen = open;
    this._panel.hidden = !open;
    this._trigger.setAttribute("aria-expanded", open ? "true" : "false");
    this._root.classList.toggle("is-open", open);
  }
}

export default WorkspaceUserMenu;
