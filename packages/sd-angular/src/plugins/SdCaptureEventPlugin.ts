import {Injectable} from "@angular/core";
import {EventManager} from "@angular/platform-browser";
import {NeverEntryError} from "@simplysm/sd-core-common";

@Injectable({providedIn: null})
export class SdCaptureEventPlugin {
  public manager!: EventManager;

  public addEventListener(element: HTMLElement, eventName: string, handler: (event: Event) => void): () => void {
    const listener = (event: Event): void => {
      this.manager.getZone().run(() => {
        handler(event);
      });
    };

    const realEventName = eventName.replace(/\.capture$/, "") as keyof DocumentEventMap;

    document.addEventListener(realEventName, listener, true);

    return (): void => {
      document.removeEventListener(realEventName, listener, true);
    };
  }

  public addGlobalEventListener(element: string, eventName: string, handler: Function): Function {
    if (element === "document") {
      const listener = (event: Event): void => {
        this.manager.getZone().run(() => {
          handler(event);
        });
      };

      const realEventName = eventName.replace(/\.capture$/, "") as keyof DocumentEventMap;

      document.addEventListener(realEventName, listener, true);

      return (): void => {
        document.removeEventListener(realEventName, listener, true);
      };
    }

    throw new NeverEntryError();
  }

  public supports(eventName: string): boolean {
    return eventName.endsWith(".capture");
  }
}
