import { queryRequired } from "@helpers/dom";
import UserCustomService from "@services/UserCustomService";
import Swal from "sweetalert2";
import { CONTROL_TEXTS } from "./texts";

class UserCustomSelector {
  private readonly _customDrawingDOMSelector: HTMLElement;
  private readonly _userListSelect: HTMLSelectElement;
  private readonly _userCustomService: UserCustomService;
  private _userCustomList: string[] = [];
  public readonly saveBtn: HTMLButtonElement;
  private readonly _cb: (speciesName: string) => void;

  /**
   * Injected by Grid in drawing mode.
   * Called at save time to get a fresh snapshot of the simulation state.
   * Returns the full 156×156 grid as a number[][] (0=DEAD, 1=ALIVE).
   */
  public getGridData: () => number[][] = () => [];

  constructor(cb: (speciesName: string) => void) {
    this._customDrawingDOMSelector = queryRequired<HTMLElement>(".custom-drawing-files");
    this._userListSelect = queryRequired<HTMLSelectElement>("#custom-file");
    this.saveBtn = queryRequired<HTMLButtonElement>(".custom-drawing-files .save");
    this._cb = cb;
    this.saveBtn.style.display = "block";
    this._userCustomService = new UserCustomService();
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
    const { value: filename } = await Swal.fire({
      title: CONTROL_TEXTS.userCustomSelector.prompt.title,
      input: "text",
      showCancelButton: true,
      confirmButtonText: CONTROL_TEXTS.userCustomSelector.prompt.confirmButtonText,
      inputValidator: (value) => {
        if (!value) {
          return CONTROL_TEXTS.userCustomSelector.prompt.filenameRequired;
        }
      },
    });
    if (filename) {
      await this._userCustomService.postCustomDrawing(this.getGridData(), filename);
      await this.getCustomList();
      await Swal.fire({
        toast: true,
        icon: "success",
        title: CONTROL_TEXTS.userCustomSelector.toast.savedSuccessfully(filename),
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
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
