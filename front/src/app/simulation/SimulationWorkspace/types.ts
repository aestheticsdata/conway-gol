import type { WorkspaceRoute } from "@app/routes";
import type { SessionCapabilities } from "@services/AuthSessionService";

export interface SimulationWorkspaceOptions {
  capabilities: SessionCapabilities;
  root: HTMLElement;
  route: WorkspaceRoute;
  onRouteModeChange: (route: WorkspaceRoute) => void;
}

export type PlaybackRestoreSnapshot =
  | { kind: "drawing"; grid: number[][]; state: Uint8Array }
  | { kind: "random"; baseGrid: number[][]; rotationDeg: number; zoomLevel: number; state: Uint8Array };
