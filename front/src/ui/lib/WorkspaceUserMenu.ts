import { queryRequired } from "@lib/dom/dom";
import { createWorkspaceUserMenu } from "@views/html/appHeader";

import type { AppPath } from "@navigation/NavigationAdapter";
import type { SessionViewer } from "@services/AuthSessionService";

interface WorkspaceUserMenuOptions {
  currentPath: AppPath;
  onLogout: () => void;
  root: HTMLElement;
}

class WorkspaceUserMenu {
  private _root: HTMLElement;
  private _trigger: HTMLButtonElement;
  private _panel: HTMLElement;
  private _logoutButton?: HTMLButtonElement;
  private readonly _container: HTMLElement;
  private readonly _currentPath: AppPath;
  private readonly _onLogout: () => void;
  private _isOpen = false;

  constructor(options: WorkspaceUserMenuOptions) {
    this._container = options.root;
    this._currentPath = options.currentPath;
    this._onLogout = options.onLogout;
    this._root = queryRequired<HTMLElement>("[data-workspace-user-menu]", this._container);
    this._trigger = queryRequired<HTMLButtonElement>("[data-workspace-user-menu-trigger]", this._root);
    this._panel = queryRequired<HTMLElement>("[data-workspace-user-menu-panel]", this._root);
    this._logoutButton = this._root.querySelector<HTMLButtonElement>("[data-workspace-logout]") ?? undefined;

    this._bindMenuEvents();
    document.addEventListener("pointerdown", this._handleDocumentPointerDown);
    document.addEventListener("keydown", this._handleDocumentKeyDown);
  }

  public update(viewer: SessionViewer): void {
    this._unbindMenuEvents();
    this._setOpen(false);

    const menuHost = document.createElement("div");
    menuHost.innerHTML = createWorkspaceUserMenu(this._currentPath, {
      avatarId: viewer.avatarId,
      sessionMode: viewer.mode,
      username: viewer.username,
    });

    const nextRoot = menuHost.firstElementChild;
    if (!(nextRoot instanceof HTMLElement)) {
      throw new Error("Workspace user menu markup is missing a root element.");
    }

    this._root.replaceWith(nextRoot);
    this._root = nextRoot;
    this._trigger = queryRequired<HTMLButtonElement>("[data-workspace-user-menu-trigger]", this._root);
    this._panel = queryRequired<HTMLElement>("[data-workspace-user-menu-panel]", this._root);
    this._logoutButton = this._root.querySelector<HTMLButtonElement>("[data-workspace-logout]") ?? undefined;
    this._bindMenuEvents();
  }

  public destroy(): void {
    this._unbindMenuEvents();
    document.removeEventListener("pointerdown", this._handleDocumentPointerDown);
    document.removeEventListener("keydown", this._handleDocumentKeyDown);
  }

  private _bindMenuEvents(): void {
    this._trigger.addEventListener("click", this._handleTriggerClick);
    this._logoutButton?.addEventListener("click", this._handleLogoutClick);
  }

  private _unbindMenuEvents(): void {
    this._trigger.removeEventListener("click", this._handleTriggerClick);
    this._logoutButton?.removeEventListener("click", this._handleLogoutClick);
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
