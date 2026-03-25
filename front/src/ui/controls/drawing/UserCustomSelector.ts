import { queryRequired } from "@helpers/dom";
import UserCustomService from "@services/UserCustomService";
import SavePresetModal from "@ui/lib/SavePresetModal";
import { CONTROL_TEXTS } from "./texts";

class UserCustomSelector {
  private readonly _customDrawingDOMSelector: HTMLElement;
  private readonly _userListSelect: HTMLSelectElement;
  private readonly _userCustomService: UserCustomService;
  private readonly _savePresetModal: SavePresetModal;
  private _userCustomList: string[] = [];
  public readonly saveBtn: HTMLButtonElement;
  private readonly _cb: (speciesName: string) => void;

  /**
   * Injected by Grid in drawing mode.
   * Called at save time to get a fresh snapshot of the simulation state.
   * Returns the full 156×156 grid as a number[][] (0=DEAD, 1=ALIVE).
   */
  public getGridData: () => number[][] = () => [];

  constructor(cb: (speciesName: string) => void, savePresetModal?: SavePresetModal) {
    this._customDrawingDOMSelector = queryRequired<HTMLElement>(".custom-drawing-files");
    this._userListSelect = queryRequired<HTMLSelectElement>("#custom-file");
    this.saveBtn = queryRequired<HTMLButtonElement>(".custom-drawing-files .save");
    this._cb = cb;
    this.saveBtn.style.display = "block";
    this._userCustomService = new UserCustomService();
    this._savePresetModal = savePresetModal ?? new SavePresetModal();
    this.saveBtn.addEventListener("click", this._save);
    this._userListSelect.addEventListener("change", this._onSelectChange);
    void this.getCustomList();
  }

  public show(): void {
    this._customDrawingDOMSelector.style.display = "block";
  }

  public hide(): void {
    this._customDrawingDOMSelector.style.display = "none";
  }

  public showSaveBtn(): void {
    this.saveBtn.style.display = "block";
  }

  public hideSaveBtn(): void {
    this.saveBtn.style.display = "none";
  }

  private _save = async () => {
    const filename = await this._savePresetModal.open({
      title: CONTROL_TEXTS.userCustomSelector.prompt.title,
      inputPlaceholder: CONTROL_TEXTS.userCustomSelector.prompt.inputPlaceholder,
      saveLabel: CONTROL_TEXTS.userCustomSelector.prompt.confirmButtonText,
      cancelLabel: CONTROL_TEXTS.userCustomSelector.prompt.cancelButtonText,
      nameRequired: CONTROL_TEXTS.userCustomSelector.prompt.filenameRequired,
      closeLabel: CONTROL_TEXTS.userCustomSelector.prompt.closeButtonLabel,
    });

    if (filename) {
      await this._userCustomService.postCustomDrawing(this.getGridData(), filename);
      await this.getCustomList();
    }
  };

  public getCustomList = async (): Promise<void> => {
    this._userCustomList = await this._userCustomService.getCustomDrawingList();
    this._createSelectButton();
  };

  private _createSelectButton(): void {
    this._userListSelect.replaceChildren(
      ...this._userCustomList.map((userCritter) => {
        const option = document.createElement("option");
        option.value = userCritter;
        option.textContent = userCritter;
        return option;
      }),
    );
  }

  private _onSelectChange = (e: Event): void => {
    this._cb((e.currentTarget as HTMLSelectElement).value);
  };
}

export default UserCustomSelector;
