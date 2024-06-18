import {ChangeDetectionStrategy, Component, Input} from "@angular/core";

@Component({
  selector: "sd-form-box",
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [],
  template: `
    <ng-content></ng-content>`,
  styles: [/* language=SCSS */ `
    :host {
      &[sd-layout="cascade"] {
        display: flex;
        flex-direction: column;
        gap: var(--gap-default);
      }

      &[sd-layout="table"] {
        display: table;
        width: 100%;
      }

      &[sd-layout="inline"] {
        display: inline-flex;
        flex-wrap: wrap;
        gap: var(--gap-sm);
      }

      &[sd-layout="none"] {
        display: contents;
      }
    }
  `],
  host: {
    "[attr.sd-layout]": "layout"
  }
})
export class SdFormBoxControl {
  @Input() layout: "cascade" | "inline" | "table" | "none" = "cascade";
  @Input() labelWidth?: string;
  @Input() labelAlign?: "left" | "right" | "center";
}
