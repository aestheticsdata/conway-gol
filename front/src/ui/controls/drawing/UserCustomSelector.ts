import { queryRequired } from "@lib/dom/dom";
import UserCustomService from "@services/UserCustomService";
import { CONTROL_TEXTS } from "@texts";
import CustomSelect from "@ui/controls/shared/CustomSelect";
import PromptModal from "@ui/lib/PromptModal";
import Tooltip from "@ui/lib/Tooltip";

class UserCustomSelector {
  private readonly _customDrawingDOMSelector: HTMLElement;
  private readonly _userCustomService: UserCustomService;
  private readonly _savePresetModal: PromptModal;
  private readonly _customSelect: CustomSelect;
  private readonly _saveTooltipTarget: HTMLElement;
  private readonly _saveDisabledTooltip: Tooltip;
  private _userCustomList: string[] = [];
  private _selectedValue = "";
  private _saveDisabledHint = "";
  public readonly saveBtn: HTMLButtonElement;
  private readonly _cb: (speciesName: string) => void;

  /**
   * Injected by Grid in drawing mode.
   * Called at save time to get a fresh snapshot of the simulation state.
   * Returns the full current grid as a number[][] (0=DEAD, 1=ALIVE).
   */
  public getGridData: () => number[][] = () => [];

  constructor(cb: (speciesName: string) => void, savePresetModal?: PromptModal) {
    this._customDrawingDOMSelector = queryRequired<HTMLElement>(".custom-drawing-files");
    this.saveBtn = queryRequired<HTMLButtonElement>(".drawing-save-action .save");
    this._saveTooltipTarget = queryRequired<HTMLElement>(".drawing-save-tooltip-target");
    this._cb = cb;
    this.saveBtn.style.display = "block";
    this._userCustomService = new UserCustomService();
    this._savePresetModal = savePresetModal ?? new PromptModal();
    this._saveDisabledTooltip = new Tooltip();
    this._customSelect = new CustomSelect(queryRequired<HTMLElement>(".custom-drawing-custom-select"), {
      onChange: this._onSelectChange,
      placeholder: CONTROL_TEXTS.userCustomSelector.placeholder,
      visibleOptionCount: 8,
    });
    this.saveBtn.addEventListener("click", this._save);
    this._saveTooltipTarget.addEventListener("pointerenter", this._handleSaveTooltipPointerEnter);
    this._saveTooltipTarget.addEventListener("pointermove", this._handleSaveTooltipPointerMove);
    this._saveTooltipTarget.addEventListener("pointerleave", this._hideSaveTooltip);
    this._saveTooltipTarget.addEventListener("pointercancel", this._hideSaveTooltip);
  }

  public show(): void {
    this._customDrawingDOMSelector.style.display = "flex";
  }

  public hide(): void {
    this._customDrawingDOMSelector.style.display = "none";
    this._saveDisabledTooltip.hide();
  }

  public showSaveBtn(): void {
    this.saveBtn.style.display = "block";
  }

  public hideSaveBtn(): void {
    this.saveBtn.style.display = "none";
  }

  public setSaveEnabled(enabled: boolean, title = ""): void {
    this.saveBtn.disabled = !enabled;
    this._saveDisabledHint = enabled ? "" : title;
    this._saveTooltipTarget.hidden = enabled;
    if (enabled) {
      this._saveDisabledTooltip.hide();
    }
  }

  public handleDocumentPointerDown(event: PointerEvent): void {
    this._customSelect.handleDocumentPointerDown(event);
  }

  public handleDocumentKeyDown(event: KeyboardEvent): void {
    this._customSelect.handleDocumentKeyDown(event);
  }

  public destroy(): void {
    this.saveBtn.removeEventListener("click", this._save);
    this._saveTooltipTarget.removeEventListener("pointerenter", this._handleSaveTooltipPointerEnter);
    this._saveTooltipTarget.removeEventListener("pointermove", this._handleSaveTooltipPointerMove);
    this._saveTooltipTarget.removeEventListener("pointerleave", this._hideSaveTooltip);
    this._saveTooltipTarget.removeEventListener("pointercancel", this._hideSaveTooltip);
    this._customSelect.destroy();
    this._saveDisabledTooltip.destroy();
  }

  public currentValue(): string {
    return this._selectedValue;
  }

  public setCurrentValue(value: string): void {
    this._selectedValue = value;
  }

  private _save = async () => {
    if (this.saveBtn.disabled) {
      return;
    }

    const filename = await this._savePresetModal.open({
      title: CONTROL_TEXTS.userCustomSelector.prompt.title,
      inputPlaceholder: CONTROL_TEXTS.userCustomSelector.prompt.inputPlaceholder,
      saveLabel: CONTROL_TEXTS.userCustomSelector.prompt.confirmButtonText,
      cancelLabel: CONTROL_TEXTS.userCustomSelector.prompt.cancelButtonText,
      nameRequired: CONTROL_TEXTS.userCustomSelector.prompt.filenameRequired,
      closeLabel: CONTROL_TEXTS.userCustomSelector.prompt.closeButtonLabel,
    });

    if (filename) {
      try {
        await this._userCustomService.postCustomDrawing(this.getGridData(), filename);
        this._selectedValue = filename;
        await this.getCustomList();
      } catch (error: unknown) {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status === 401) {
          await this._savePresetModal.openNotice({
            closeLabel: CONTROL_TEXTS.drawing.hxfImportCloseLabel,
            description: CONTROL_TEXTS.drawing.sessionExpiredMessage,
            saveLabel: CONTROL_TEXTS.drawing.hxfImportCloseLabel,
            title: CONTROL_TEXTS.drawing.sessionExpiredTitle,
          });
          return;
        }

        throw error;
      }
    }
  };

  public getCustomList = async (): Promise<void> => {
    this._userCustomList = await this._userCustomService.getCustomDrawingList();
    this._createSelectButton();
  };

  private _createSelectButton(): void {
    const selectedValue =
      this._selectedValue && this._userCustomList.includes(this._selectedValue) ? this._selectedValue : "";

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

  private _handleSaveTooltipPointerEnter = (event: PointerEvent): void => {
    this._showSaveTooltip(event);
  };

  private _handleSaveTooltipPointerMove = (event: PointerEvent): void => {
    this._showSaveTooltip(event);
  };

  private _hideSaveTooltip = (): void => {
    this._saveDisabledTooltip.hide();
  };

  private _showSaveTooltip(event: PointerEvent): void {
    if (event.pointerType === "touch" || !this.saveBtn.disabled || !this._saveDisabledHint) {
      this._saveDisabledTooltip.hide();
      return;
    }

    this._saveDisabledTooltip.show(this._saveDisabledHint, {
      clientX: event.clientX,
      clientY: event.clientY,
    });
  }
}

export default UserCustomSelector;
