import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
  selector: "sd-card",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content></ng-content>`,
  styles: [/* language=SCSS */ `
    @import "../../scss/mixins";

    :host {
      display: block;
      background: white;
      border-radius: var(--border-radius-default);
      //@include elevation(8);
      overflow: hidden;
    }
  `]
})
export class SdCardControl {
}

