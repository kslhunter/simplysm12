import {
  AfterContentChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChild,
  ContentChildren,
  DoCheck,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostBinding,
  Input,
  IterableDiffer,
  IterableDiffers,
  OnInit,
  Output,
  QueryList,
  TemplateRef,
  ViewChild
} from "@angular/core";
import {SdMultiSelectItemControl} from "./SdMultiSelectItemControl";
import {SdInputValidate} from "../commons/SdInputValidate";

@Component({
  selector: "sd-multi-select",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-dropdown [disabled]="disabled" (open)="open.emit()" (close)="close.emit()">
      <div #content></div>
      <div class="_icon">
        <sd-icon fixedWidth icon="caret-down"></sd-icon>
      </div>

      <sd-dropdown-popup>
        <ng-container *ngIf="!items">
          <ng-content></ng-content>
        </ng-container>
        <ng-container *ngIf="items">
          <sd-dock-container>
            <sd-dock>
              <ng-template [ngTemplateOutlet]="headerTemplateRef"></ng-template>
            </sd-dock>
            <sd-pane>
              <ng-template #rowOfList let-items="items">
                <ng-container *ngFor="let item of items; let i = index; trackBy: trackByItemFn">
                  <div class="_sd-multi-select-item">
                    <ng-template [ngTemplateOutlet]="itemTemplateRef"
                                 [ngTemplateOutletContext]="{item: item}"></ng-template>

                    <ng-container *ngIf="getChildrenFn && getChildrenFn!(i, item) && getChildrenFn!(i, item).length > 0">
                      <div class="_children">
                        <ng-template [ngTemplateOutlet]="rowOfList"
                                     [ngTemplateOutletContext]="{items: getChildrenFn(i, item)}"></ng-template>
                      </div>
                    </ng-container>
                  </div>
                </ng-container>
              </ng-template>
              <ng-template [ngTemplateOutlet]="rowOfList"
                           [ngTemplateOutletContext]="{items: items}"></ng-template>
            </sd-pane>
          </sd-dock-container>
        </ng-container>
      </sd-dropdown-popup>
    </sd-dropdown>`,
  styles: [/* language=SCSS */ `
    @import "../../scss/mixins";

    :host {
      display: block;
      width: 100%;
      min-width: 120px;

      /deep/ > sd-dropdown > div {
        @include form-control-base();

        background: var(--theme-color-secondary-lightest);
        text-align: left;
        display: block;
        overflow: visible;
        padding-right: 30px !important;
        height: calc(var(--gap-sm) * 2 + var(--font-size-default) * var(--line-height-strip-unit) + 2px);

        border-color: var(--trans-brightness-default);
        transition: outline-color .1s linear;
        outline: 1px solid transparent;
        outline-offset: -1px;
        cursor: pointer;

        > div:first-child {
          overflow: hidden;
          white-space: nowrap;

          > ._placeholder {
            color: var(--text-brightness-lighter);
          }
        }

        > ._icon {
          position: absolute;
          top: -1px;
          right: -1px;
          padding: var(--gap-sm) 0;
          width: 30px;
          text-align: center;
          pointer-events: none;
        }

        &:focus {
          outline-color: var(--theme-color-primary-default);
        }
      }

      &[sd-disabled=true] /deep/ > sd-dropdown > div {
        background: var(--theme-color-grey-lightest);
        color: var(--text-brightness-light);
      }

      &[sd-size=sm] /deep/ > sd-dropdown > div {
        padding: var(--gap-xs) var(--gap-sm);

        > ._icon {
          padding: var(--gap-xs) 0;
        }

        height: calc(var(--gap-xs) * 2 + var(--font-size-default) * var(--line-height-strip-unit) + 2px);
      }

      &[sd-size=lg] /deep/ > sd-dropdown > div {
        padding: var(--gap-default) var(--gap-lg);

        > ._icon {
          padding: var(--gap-default) 0;
        }

        height: calc(var(--gap-default) * 2 + var(--font-size-default) * var(--line-height-strip-unit) + 2px);
      }

      &[sd-inset=true] {
        > /deep/ sd-dropdown > div {
          border: none;
          border-radius: 0;
          height: calc(var(--gap-sm) * 2 + var(--font-size-default) * var(--line-height-strip-unit));
        }

        &[sd-size=sm] > /deep/ sd-dropdown > div {
          height: calc(var(--gap-xs) * 2 + var(--font-size-default) * var(--line-height-strip-unit));
        }

        &[sd-size=lg] > /deep/ sd-dropdown > div {
          height: calc(var(--gap-default) * 2 + var(--font-size-default) * var(--line-height-strip-unit));
        }

        > /deep/ sd-dropdown > div:focus {
          outline: 1px solid var(--theme-color-primary-default);
          outline-offset: -1px;
        }
      }
    }

    ._sd-multi-select-item > ._children {
      border-left: var(--gap-xl) solid var(--theme-color-secondary-lightest);
    }
  `]
})
export class SdMultiSelectControl implements DoCheck, OnInit, AfterContentChecked {
  @Input()
  @SdInputValidate(Array)
  public value?: any[];

  @Output()
  public readonly valueChange = new EventEmitter<any[]>();

  @Input()
  @SdInputValidate(Boolean)
  @HostBinding("attr.sd-disabled")
  public disabled?: boolean;

  @Input()
  @SdInputValidate(String)
  public keyProp?: string;

  @ContentChildren(forwardRef(() => SdMultiSelectItemControl), {descendants: true})
  public itemControls?: QueryList<SdMultiSelectItemControl>;

  private readonly _iterableDiffer: IterableDiffer<any>;

  @Output()
  public readonly open = new EventEmitter();

  @Output()
  public readonly close = new EventEmitter();

  @ViewChild("content", {static: true})
  public contentElRef?: ElementRef<HTMLDivElement>;

  @ContentChild("item", {static: true})
  public itemTemplateRef?: TemplateRef<any>;

  @ContentChild("header", {static: true})
  public headerTemplateRef?: TemplateRef<any>;

  @Input()
  @SdInputValidate(Array)
  public items?: any[];

  @Input()
  @SdInputValidate(Function)
  public trackByFn?: (index: number, item: any) => any;

  @Input()
  @SdInputValidate(Function)
  public getChildrenFn?: (index: number, item: any) => any;

  @Input()
  @SdInputValidate(String)
  public placeholder?: string;

  @Input()
  @SdInputValidate(Boolean)
  public set required(value: boolean | undefined) {
    this._required = value;
    this._refreshInvalid();
  }

  public get required(): boolean | undefined {
    return this._required;
  }

  private _required: boolean | undefined;

  @Input()
  @SdInputValidate(Boolean)
  @HostBinding("attr.sd-inset")
  public inset?: boolean;

  @Input()
  @SdInputValidate({type: String, includes: ["sm", "lg"]})
  @HostBinding("attr.sd-size")
  public size?: "sm" | "lg";

  public trackByItemFn(index: number, item: any): any {
    if (this.trackByFn) {
      return this.trackByFn(index, item) ?? item;
    }
    else {
      return item;
    }
  }

  public constructor(private readonly _iterableDiffers: IterableDiffers,
                     private readonly _cdr: ChangeDetectorRef,
                     private readonly _elRef: ElementRef) {
    this._iterableDiffer = this._iterableDiffers.find([]).create((index, item) => item);
  }

  public ngOnInit(): void {
    this._render();
  }

  public ngDoCheck(): void {
    if (this.value && this._iterableDiffer.diff(this.value)) {
      this._cdr.markForCheck();
    }
  }

  public ngAfterContentChecked(): void {
    this._render();
  }

  public getIsItemSelected(item: SdMultiSelectItemControl): boolean {
    if (this.keyProp === undefined) {
      return this.value ? this.value.includes(item.value) : false;
    }
    else {
      return this.value ? this.value.map(item1 => item1[this.keyProp!]).includes(item.value[this.keyProp]) : false;
    }
  }

  private _render(): void {
    if (!this.itemControls || !this.value || !this.contentElRef) return;

    let content = "";
    const selectedItemControls = this.itemControls.toArray().filter(item => this.getIsItemSelected(item));
    for (const selectedItemControl of selectedItemControls) {
      if (selectedItemControl.labelTemplateRef) {
        /*const embeddedView = selectedItemControl.labelTemplateRef.createEmbeddedView({});*/
        content += selectedItemControl.elRef.nativeElement.findAll("> sd-checkbox > label > ._content > ._labelTemplate")[0].innerHTML + ",\n";
      }
      else {
        content += selectedItemControl.elRef.nativeElement.findAll("> sd-checkbox > label > ._content > ._label")[0].innerHTML + ",\n";
      }
    }
    content = content.slice(0, -2);

    this.contentElRef.nativeElement.innerHTML = content ?? (this.placeholder !== undefined ? "<div class='_placeholder'>" + this.placeholder + "</div>" : "");
  }


  private _refreshInvalid(): void {
    if (this.required && (this.value === undefined || this.value.length < 1)) {
      this._elRef.nativeElement.setAttribute("sd-invalid", "true");
    }
    else {
      this._elRef.nativeElement.setAttribute("sd-invalid", "false");
    }
  }
}