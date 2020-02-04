import {ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, Output} from "@angular/core";
import {SdInputValidate} from "../commons/SdInputValidate";
import {DateOnly, DateTime, Time} from "@simplysm/sd-core-common";
import {DomSanitizer, SafeHtml} from "@angular/platform-browser";

@Component({
  selector: "sd-textfield",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input *ngIf="!multiline"
           [value]="controlValue"
           [attr.type]="controlType"
           [attr.placeholder]="placeholder"
           [attr.disabled]="disabled"
           [attr.required]="required"
           [attr.min]="min"
           [attr.max]="max"
           [attr.step]="controlStep"
           [attr.pattern]="pattern"
           [attr.class]="safeHtml(inputClass)"
           [attr.style]="safeHtml(inputStyle)"
           (input)="onInput($event)"/>
    <textarea *ngIf="multiline"
              [value]="controlValue"
              [attr.placeholder]="placeholder"
              [attr.disabled]="disabled"
              [attr.required]="required"
              [attr.rows]="rows"
              [attr.class]="safeHtml(inputClass)"
              [attr.style]="safeHtml((controlResize ? 'resize: ' + controlResize + ';' : '') + inputStyle)"
              (input)="onInput($event)"></textarea>
    <div class="_invalid-indicator"></div>`,
  styles: [/* language=SCSS */ `
    @import "../../scss/mixins";

    :host {
      position: relative;

      > input,
      > textarea {
        @include form-control-base();

        background: var(--theme-color-info-lightest);
        border: 1px solid var(--sd-border-color);
        border-radius: 2px;

        &::-webkit-input-placeholder {
          color: var(--text-brightness-lighter);
        }

        &:disabled {
          background: var(--theme-color-grey-lightest) !important;
          color: var(--text-brightness-light);
        }
      }

      > input {
        height: calc(var(--gap-sm) * 2 + var(--font-size-default) * var(--line-height-strip-unit) + 2px);

        &::-webkit-outer-spin-button,
        &::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        &::-webkit-calendar-picker-indicator {
          background: transparent;
          color: var(--theme-color-info-default);
          cursor: pointer;
        }

        &[type=color] {
          padding-top: 1px;
          padding-bottom: 1px;
          min-width: 40px;
        }
      }

      &[sd-inline=true] > input,
      &[sd-inline=true] > textarea {
        display: inline-block;
        width: auto;
        vertical-align: top;
      }

      &[sd-size=sm] > input,
      &[sd-size=sm] > textarea {
        padding: var(--gap-xs) var(--gap-sm);

        &[type=color] {
          padding-top: 1px;
          padding-bottom: 1px;
        }
      }

      &[sd-size=sm] > input {
        height: calc(var(--gap-xs) * 2 + var(--font-size-default) * var(--line-height-strip-unit) + 2px);
      }

      &[sd-size=lg] > input,
      &[sd-size=lg] > textarea {
        padding: var(--gap-default) var(--gap-lg);

        &[type=color] {
          padding-top: 1px;
          padding-bottom: 1px;
        }
      }

      &[sd-size=lg] > input {
        height: calc(var(--gap-default) * 2 + var(--font-size-default) * var(--line-height-strip-unit) + 2px);
      }


      &[sd-inset=true] > input,
      &[sd-inset=true] > textarea {
        border: none;
        border-radius: 0;
      }

      &[sd-inset=true] {
        > input {
          height: calc(var(--gap-sm) * 2 + var(--font-size-default) * var(--line-height-strip-unit));
        }

        &[sd-size=sm] > input {
          height: calc(var(--gap-xs) * 2 + var(--font-size-default) * var(--line-height-strip-unit));
        }

        &[sd-size=lg] > input {
          height: calc(var(--gap-default) * 2 + var(--font-size-default) * var(--line-height-strip-unit));
        }

        > input:focus {
          outline: 1px solid var(--theme-color-primary-default);
          outline-offset: -1px;
        }
      }

      > ._invalid-indicator {
        display: none;
      }

      > input:invalid + ._invalid-indicator,
      > textarea:invalid + ._invalid-indicator {
        @include invalid-indicator();
      }
    }
  `]
})
export class SdTextfieldControl {
  @Input()
  @SdInputValidate({
    type: String,
    includes: ["number", "text", "password", "date", "datetime", "datetime-sec", "time", "time-sec", "month", "year", "color", "email"],
    notnull: true
  })
  public type: "number" | "text" | "password" | "date" | "datetime" | "datetime-sec" | "time" | "time-sec" | "month" | "year" | "color" | "email" = "text";

  @Input()
  @SdInputValidate(String)
  public placeholder?: string;

  @Input()
  @SdInputValidate([Number, String, DateOnly, DateTime, Time])
  public value?: number | string | DateOnly | DateTime | Time;

  @Output()
  public readonly valueChange = new EventEmitter<number | string | DateOnly | DateTime | Time | undefined>();

  @Input()
  @SdInputValidate(Boolean)
  public disabled?: boolean;

  @Input()
  @SdInputValidate(Boolean)
  public required?: boolean;

  @Input()
  @SdInputValidate(Number)
  public min?: number;

  @Input()
  @SdInputValidate(Number)
  public max?: number;

  @Input()
  @SdInputValidate(Number)
  public step?: number;

  @Input()
  @SdInputValidate(String)
  public pattern?: string;

  @Input()
  @SdInputValidate(Boolean)
  @HostBinding("attr.sd-inline")
  public inline?: boolean;

  @Input()
  @SdInputValidate(Boolean)
  @HostBinding("attr.sd-inset")
  public inset?: boolean;

  @Input()
  @SdInputValidate({
    type: String,
    includes: ["sm", "lg"]
  })
  @HostBinding("attr.sd-size")
  public size?: "sm" | "lg";

  @Input()
  @SdInputValidate(Boolean)
  public multiline?: boolean;

  @Input()
  @SdInputValidate(Number)
  public rows?: number;

  @Input()
  @SdInputValidate({
    type: [String, Boolean],
    includes: ["vertical", "horizontal", true, false]
  })
  public resize?: "vertical" | "horizontal" | boolean;

  @Input()
  @SdInputValidate(Function)
  public validatorFn?: (value: number | string | DateOnly | DateTime | Time | undefined) => string | void;


  @Input("input.style")
  @SdInputValidate(String)
  public inputStyle?: string;

  @Input("input.class")
  @SdInputValidate(String)
  public inputClass?: string;

  public get controlType(): string {
    return this.type === "number" ? "text"
      : this.type === "datetime" ? "datetime-local"
        : this.type === "datetime-sec" ? "datetime-local"
          : this.type === "time-sec" ? "time"
            : this.type;
  }

  public get controlStep(): number | undefined {
    if (this.step) {
      return this.step;
    }
    else if (this.type === "datetime-sec") {
      return 1;
    }
    else if (this.type === "time-sec") {
      return 1;
    }
    return undefined;
  }

  public get controlValue(): string {
    if (this.value === undefined) {
      return "";
    }
    else if (this.type === "number" && typeof this.value === "number") {
      return this.value.toLocaleString(undefined, {maximumFractionDigits: 10});
    }
    else if (this.type === "datetime" && this.value instanceof DateTime) {
      return this.value.toFormatString("yyyy-MM-ddTHH:mm");
    }
    else if (this.type === "datetime-sec" && this.value instanceof DateTime) {
      return this.value.toFormatString("yyyy-MM-ddTHH:mm:ss");
    }
    else if (this.type === "year" && this.value instanceof DateOnly) {
      return this.value.toFormatString("yyyy");
    }
    else if (this.type === "month" && this.value instanceof DateOnly) {
      return this.value.toFormatString("yyyy-MM");
    }
    else if (this.type === "date" && this.value instanceof DateOnly) {
      return this.value.toFormatString("yyyy-MM-dd");
    }
    else if (this.type === "time" && this.value instanceof DateOnly) {
      return this.value.toFormatString("HH:mm");
    }
    else if (this.type === "time-sec" && this.value instanceof DateOnly) {
      return this.value.toFormatString("HH:mm:ss");
    }
    else if (typeof this.value === "string") {
      return this.value;
    }
    else {
      throw new Error(`'sd-textfield'에 대한 'value'가 잘못되었습니다. (입력값: ${this.value})`);
    }
  }

  public get controlResize(): "vertical" | "horizontal" | "none" | undefined {
    return this.resize === "vertical" ? "vertical"
      : this.resize === "horizontal" ? "horizontal"
        : this.resize ? undefined : "none";
  }

  public constructor(private readonly _sanitization: DomSanitizer) {
  }

  public safeHtml(value?: string): SafeHtml | undefined {
    return value ? this._sanitization.bypassSecurityTrustStyle(value) : undefined;
  }

  public onInput(event: Event): void {
    const inputEl = event.target as (HTMLInputElement | HTMLTextAreaElement);

    if (!inputEl.value) {
      this.value = undefined;
    }
    else if (this.type === "number") {
      const inputValue = Number(inputEl.value.replace(/[^0-9]/g, ""));
      const newValue = Number.isNaN(inputValue) ? inputEl.value : inputValue;
      this.value = newValue;

      if (this.value === newValue) {
        inputEl.value = newValue.toString();
      }
    }
    else if (["year", "month", "date"].includes(this.type)) {
      this.value = DateOnly.parse(inputEl.value);
    }
    else if (["datetime", "datetime-sec"].includes(this.type)) {
      this.value = DateTime.parse(inputEl.value);
    }
    else if (["time", "time-sec"].includes(this.type)) {
      this.value = Time.parse(inputEl.value);
    }
    else {
      this.value = inputEl.value;
    }

    if (this.validatorFn) {
      const message = this.validatorFn(this.value);
      if (message) {
        inputEl.setCustomValidity(message);
      }
      else {
        inputEl.setCustomValidity("");
      }
    }

    this.valueChange.emit(this.value);
  }
}