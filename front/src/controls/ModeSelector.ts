import { queryAll } from "@helpers/dom";

export type Mode = 'random' | 'zoo' | 'drawing';

class ModeSelector {
  constructor(setMode: (mode: Mode) => void) {
    queryAll<HTMLInputElement>('input[name="mode"]').forEach((el) => {
      el.addEventListener("change", (e: Event) => {
        setMode((e.currentTarget as HTMLInputElement).value as Mode);
      });
    });
  }
}

export default ModeSelector
