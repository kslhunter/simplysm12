import {ApplicationRef, ComponentFactoryResolver, Injectable, Injector} from "@angular/core";
import {Type} from "@simplysm/sd-core";
import {SdModalControl} from "./SdModalControl";

@Injectable()
export class SdModalProvider {
  public constructor(private readonly _cfr: ComponentFactoryResolver,
                     private readonly _injector: Injector,
                     private readonly _appRef: ApplicationRef) {
  }

  public modalCount = 0;

  public async show<T extends SdModalBase<any, any>>(modalType: Type<T>, title: string, param: T["_tParam"], option?: { hideCloseButton?: boolean; float?: boolean; minHeight?: string; useCloseByBackdrop?: boolean }): Promise<T["_tResult"] | undefined> {

    this.modalCount++;

    return await new Promise<T["_tResult"]>(resolve => {
      const compRef = this._cfr.resolveComponentFactory(modalType).create(this._injector);
      const rootComp = this._appRef.components[0];
      const rootCompEl = rootComp.location.nativeElement as HTMLElement;

      const modalRef = this._cfr.resolveComponentFactory(SdModalControl).create(
        this._injector,
        [[compRef.location.nativeElement]]
      );
      const modalEl = modalRef.location.nativeElement as HTMLElement;
      rootCompEl.appendChild(modalEl);

      const activeElement = document.activeElement as HTMLElement | undefined;
      const close = (value?: any) => {
        resolve(value);

        modalEl.addEventListener("transitionend", () => {
          compRef.destroy();
          modalRef.destroy();
        });
        modalRef.instance.open = false;

        if (activeElement) {
          activeElement.focus();
        }

        this.modalCount--;
      };

      modalRef.instance.title = title;
      modalRef.instance.hideCloseButton = option && option.hideCloseButton;
      modalRef.instance.useCloseByBackdrop = option && option.useCloseByBackdrop;
      modalRef.instance.float = option && option.float;
      modalRef.instance.minHeight = option && option.minHeight;
      modalRef.instance.close.subscribe(() => {
        close();
      });

      compRef.instance.close = close.bind(this); //tslint:disable-line:unnecessary-bind

      setTimeout(async () => {
        this._appRef.attachView(compRef.hostView);
        this._appRef.attachView(modalRef.hostView);
        this._appRef.tick();

        try {
          if (activeElement) {
            activeElement.blur();
          }
          modalRef.instance.open = true;
          this._appRef.tick();
          await compRef.instance.sdOnOpen(param);
          this._appRef.tick();
        }
        catch (e) {
          close();
          throw e;
        }
      });
    });
  }
}

export abstract class SdModalBase<P, R> {
  public _tParam!: P;
  public _tResult!: R;

  public abstract sdOnOpen(param: P): void | Promise<void>;

  public close: (value?: R) => void = (value?: R) => {
    throw new Error("모달이 초기화되어있지 않습니다.");
  };
}
