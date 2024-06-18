import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from "@angular/core";
import {coercionBoolean} from "../utils/commons";

@Component({
  selector: "sd-checkbox-group",
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [],
  template: `
    <ng-content></ng-content>`,
  host: {
    "[attr.sd-disabled]": "disabled"
  }
})
export class SdCheckboxGroupControl<T> {
  @Input() value: T[] = [];
  @Output() valueChange = new EventEmitter<T[]>();

  @Input({transform: coercionBoolean}) disabled = false;
  @Input() keyProp?: string;
}
