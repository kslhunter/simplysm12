import {Wait} from "@simplysm/common";

export class SdFileDialogProvider {
  public async showAsync(): Promise<File | undefined> {
    return await new Promise<File | undefined>(resolve => {
      const inputEl = document.createElement("input");
      inputEl.type = "file";
      inputEl.multiple = false;
      inputEl.onchange = (event: Event) => {
        document.body.removeChild(inputEl);

        const file = event.target!["files"][0];
        resolve(file);
      };
      inputEl.style.opacity = "0";
      inputEl.style.position = "fixed";
      inputEl.style.top = "0";
      inputEl.style.left = "0";
      inputEl.style.pointerEvents = "none";
      document.body.appendChild(inputEl);
      inputEl.focus();
      inputEl.click();

      inputEl.onfocus = async () => {
        document.body.removeChild(inputEl);

        await Wait.time(100);
        resolve();
      };
    });
  }
}