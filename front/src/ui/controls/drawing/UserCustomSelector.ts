import { queryRequired } from "@helpers/dom";
import UserCustomService from "@services/UserCustomService";
import CustomSelect from "@ui/controls/shared/CustomSelect";
import SavePresetModal from "@ui/lib/SavePresetModal";
import { CONTROL_TEXTS } from "./texts";

class UserCustomSelector {
  private readonly _customDrawingDOMSelector: HTMLElement;
  private readonly _userCustomService: UserCustomService;
  private readonly _savePresetModal: SavePresetModal;
  private readonly _customSelect: CustomSelect;
  private _userCustomList: string[] = [];
  private _selectedValue = "";
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
    this.saveBtn = queryRequired<HTMLButtonElement>(".drawing-save-action .save");
    this._cb = cb;
    this.saveBtn.style.display = "block";
    this._userCustomService = new UserCustomService();
    this._savePresetModal = savePresetModal ?? new SavePresetModal();
    this._customSelect = new CustomSelect(queryRequired<HTMLElement>(".custom-drawing-custom-select"), {
      onChange: this._onSelectChange,
      visibleOptionCount: 8,
    });
    this.saveBtn.addEventListener("click", this._save);
    void this.getCustomList();
  }

  public show(): void {
    this._customDrawingDOMSelector.style.display = "flex";
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

  public handleDocumentPointerDown(event: PointerEvent): void {
    this._customSelect.handleDocumentPointerDown(event);
  }

  public handleDocumentKeyDown(event: KeyboardEvent): void {
    this._customSelect.handleDocumentKeyDown(event);
  }

  public destroy(): void {
    this.saveBtn.removeEventListener("click", this._save);
    this._customSelect.destroy();
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
      this._selectedValue = filename;
      await this.getCustomList();
    }
  };

  public getCustomList = async (): Promise<void> => {
    this._userCustomList = await this._userCustomService.getCustomDrawingList();
    this._createSelectButton();
  };

  private _createSelectButton(): void {
    const selectedValue =
      this._selectedValue && this._userCustomList.includes(this._selectedValue)
        ? this._selectedValue
        : (this._userCustomList[0] ?? "");

    this._customSelect.setOptions(
      this._userCustomList.map((userCritter) => ({ value: userCritter, label: userCritter })),
      selectedValue,
    );
    this._selectedValue = this._customSelect.value();
  }

  private _onSelectChange = (value: string): void => {
    this._selectedValue = value;
    this._cb(value);
  };
}

export default UserCustomSelector;
