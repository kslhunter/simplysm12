import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  Input,
  NgZone,
  OnChanges,
  SimpleChanges
} from "@angular/core";
import { SdInputValidate } from "../decorators/SdInputValidate";

@Component({
  selector: "sd-collapse",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="_content">
      <ng-content></ng-content>
    </div>`,
  styles: [/* language=SCSS */ `
    :host {
      display: block;
      overflow: hidden;
    }
  `]
})
export class SdCollapseControl implements AfterViewInit, OnChanges {
  @Input()
  @SdInputValidate(Boolean)
  public open?: boolean;

  @HostBinding("attr.sd-init")
  private _isInitialized = false;

  public constructor(private readonly _zone: NgZone,
                     private readonly _elRef: ElementRef<HTMLElement>) {
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if ("open" in changes) {
      this._redraw();
    }
  }

  public ngAfterViewInit(): void {
    const contentEl = this._elRef.nativeElement.findFirst("> ._content")!;

    this._zone.runOutsideAngular(() => {
      contentEl.addEventListener("resize", () => {
        this._redraw();
      });
    });

    this._redraw();

    this._isInitialized = true;
  }

  private _redraw(): void {
    const contentEl = this._elRef.nativeElement.findFirst("> ._content");
    if (!contentEl) return;

    if (this.open) {
      if (this._isInitialized) {
        contentEl.style.transition = "margin-top .1s ease-out";
      }
      contentEl.style.marginTop = "0px";
    }
    else {
      if (this._isInitialized) {
        contentEl.style.transition = "margin-top .1s ease-in";
      }
      contentEl.style.marginTop = -contentEl.offsetHeight + "px";
    }
  }
}