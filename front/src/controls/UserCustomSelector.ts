import Swal from "sweetalert2";
import UserCustomService from "../services/UserCustomService";
import type { CellGrid } from "../Grid/Grid";


class UserCustomSelector {
  private _customDrawingDOMSelector: HTMLSelectElement = document.querySelector('.custom-drawing-files');
  private _userListSelector: HTMLSelectElement = document.querySelector('.user-select-container');
  private _userCustomService: UserCustomService;
  private _userCustomList;
  public  saveBtn: HTMLButtonElement = document.querySelector('.custom-drawing-files .save');
  public gridData: CellGrid;
  private _cb;

  constructor(cb) {
    this._cb = cb;
    this.saveBtn.style.display = "block";
    this._userCustomService = new UserCustomService();
    this.saveBtn.addEventListener("click", this._save);
    if (!this._userCustomList) {
      this.getCustomList();
    }
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
      this._userListSelector.children[0].children[1].innerHTML = "";
      await this.getCustomList();
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

  public getCustomList = async () => {
    const { data } = await this._userCustomService.getCustomdrawingList();
    this._userCustomList = data;
    this._createSelectButton();
  }

  private _createSelectButton() {
    this._userListSelector.children[0].children[1].innerHTML = "";
    this._userCustomList.forEach(userCritter => {
      const option = `<option name="${userCritter}">${userCritter}</option>`;
      this._userListSelector.children[0].children[1].insertAdjacentHTML('beforeend', option);
    });

    this._userListSelector.addEventListener('change', (e) => {
      e.preventDefault();
      this._cb((<HTMLSelectElement>e.target).value);
    })
  }
}

export default UserCustomSelector;

