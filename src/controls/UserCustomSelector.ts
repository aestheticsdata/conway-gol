import Swal from "sweetalert2";
import UserCustomService from "../services/UserCustomService";
import type { CellGrid } from "../Grid/Grid";


class UserCustomSelector {
  private _customDrawingDOMSelector: HTMLSelectElement = document.querySelector('.custom-drawing-files');
  public  saveBtn: HTMLButtonElement = document.querySelector('.custom-drawing-files .save');
  private _userCustomService: UserCustomService;
  public gridData: CellGrid;

  constructor() {
    this.saveBtn.style.display = "block";
    this._userCustomService = new UserCustomService();
    this.saveBtn.addEventListener("click", this._save);
  }

  public show() {
    this._customDrawingDOMSelector.style.display = "block";
  }
  public hide() {
    this._customDrawingDOMSelector.style.display = "none";
  }
  public showSaveBtn() {
    this.saveBtn.style.display = "block";
  }
  public hideSaveBtn() {
    this.saveBtn.style.display = "none";
  }

  private _save = async () => {
    const { value: filename } = await Swal.fire({
      title: 'enter a filename',
      input: 'text',
      showCancelButton: true,
      confirmButtonText: 'save',
      inputValidator: (value) => { if (!value) { return 'filename required' } },
    });
    if (filename) {
      await this._userCustomService.postCustomDrawing(this.gridData, filename);
      await Swal.fire({
        toast: true,
        icon: 'success',
        title: `${filename} saved successfully`,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
      });
    }
  }
}

export default UserCustomSelector;

