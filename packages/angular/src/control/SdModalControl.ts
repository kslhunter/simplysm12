import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input, OnInit
} from "@angular/core";
import {SdTypeValidate} from "../decorator/SdTypeValidate";
import {SdLocalStorageProvider} from "../provider/SdLocalStorageProvider";
import {optional} from "@simplism/core";


@Component({
  selector: "sd-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="_backdrop" (click)="onBackdropClick()"></div>
    <div class="_dialog" tabindex="0" [style.minHeight]="minHeight">
      <sd-dock-container>
        <sd-dock class="_header"  (mousedown)="onHeaderMouseDown($event)">
          <h5 class="_title">{{ title }}</h5>
          <a class="_close-button"
             (click)="onCloseButtonClick()"
             *ngIf="!hideCloseButton">
            <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
          </a>
        </sd-dock>

        <sd-pane class="_content">
          <ng-content></ng-content>
        </sd-pane>
      </sd-dock-container>
    </div>`
})
export class SdModalControl implements OnInit {
  @Input()
  @SdTypeValidate({type: String, notnull: true})
  public title!: string;

  @Input()
  @SdTypeValidate(Boolean)
  public hideCloseButton?: boolean;

  @Input()
  @SdTypeValidate(Boolean)
  public useCloseByBackdrop?: boolean;

  @Input()
  @SdTypeValidate(Boolean)
  @HostBinding("attr.sd-open")
  public open?: boolean;

  public close = new EventEmitter<any>();

  @Input()
  @SdTypeValidate(Boolean)
  @HostBinding("attr.sd-float")
  public float?: boolean;

  @Input()
  @SdTypeValidate(String)
  public minHeight?: string;

  private _sizeConfig: { width?: number; height?: number } | undefined;

  public constructor(private readonly _elRef: ElementRef,
                     private readonly _localStorage: SdLocalStorageProvider) {
  }

  public ngOnInit(): void {
    const dialogEl = (this._elRef.nativeElement as HTMLElement).findAll("> ._dialog")[0] as HTMLElement;

    this._sizeConfig = this._localStorage.get(`sd-modal.${this.title}.size-config`);
    if (this._sizeConfig) {
      dialogEl.style.width = this._sizeConfig.width + "px";
      dialogEl.style.height = this._sizeConfig.height + "px";
    }

    dialogEl.addEventListener("resize", event => {
      if (event.detail["dimensions"].includes("height")) {
        const el = (this._elRef.nativeElement as HTMLElement);
        const style = getComputedStyle(el);
        if (dialogEl.offsetHeight > el.offsetHeight - (optional(() => Number.parseInt(style.paddingTop!.match(/\d/g)!.join(""), 10) * 2) || 0)) {
          dialogEl.style.height = `calc(100% - ${getComputedStyle(el).paddingTop})`;
        }
      }
    });
  }

  public onBackdropClick(): void {
    if (this.hideCloseButton) {
      return;
    }

    this.onCloseButtonClick();
  }

  public onCloseButtonClick(): void {
    this.open = false;
    this.close.emit();
  }

  public onHeaderMouseDown(event: MouseEvent): void {
    const el = (this._elRef.nativeElement as HTMLElement).findAll("> ._dialog")[0] as HTMLElement;
    const startX = event.clientX;
    const startY = event.clientY;
    const startTop = el.offsetTop;
    const startLeft = el.offsetLeft;

    const doDrag = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      el.style.position = "absolute";
      el.style.left = `${startLeft + e.clientX - startX}px`;
      el.style.top = `${startTop + e.clientY - startY}px`;
      el.style.right = `auto`;
      el.style.bottom = `auto`;
    };

    const stopDrag = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      document.documentElement!.removeEventListener("mousemove", doDrag, false);
      document.documentElement!.removeEventListener("mouseup", stopDrag, false);
    };

    document.documentElement!.addEventListener("mousemove", doDrag, false);
    document.documentElement!.addEventListener("mouseup", stopDrag, false);
  }

  @HostListener("keydown", ["$event"])
  public onKeydown(event: KeyboardEvent): void {
    if (this.hideCloseButton) {
      return;
    }

    if (event.key === "Escape") {
      this.onCloseButtonClick();
    }
  }

  @HostListener("document:backbutton", ["$event"])
  public onAndroidBackButtonTouch(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.hideCloseButton) {
      return;
    }

    this.onCloseButtonClick();
  }
}