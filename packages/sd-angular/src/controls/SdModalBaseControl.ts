import {ChangeDetectionStrategy, Component, inject, input} from "@angular/core";
import {SdBusyContainerControl} from "./SdBusyContainerControl";
import {SdIconControl} from "./SdIconControl";
import {SdAngularOptionsProvider} from "../providers/SdAngularOptionsProvider";

@Component({
  selector: "sd-modal-base",
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    SdBusyContainerControl,
    SdIconControl
  ],
  template: `
    <sd-busy-container [busy]="busyCount() > 0 || !initialized()"
                       [class]="contentClass()">
      @if (initialized()) {
        @if (!hasPerm()) {
          <div class="tx-theme-grey-light p-xxl"
               style="text-align: center">
            <br/>
            <sd-icon [icon]="icons.triangleExclamation" fixedWidth size="5x"/>
            <br/>
            <br/>
            이 기능의 사용권한이 없습니다.
            시스템 관리자에게 문의하세요.
          </div>
        } @else {
          <ng-content/>
        }
      }
    </sd-busy-container>`
})
export class SdModalBaseControl {
  icons = inject(SdAngularOptionsProvider).icons;

  initialized = input.required<boolean>();
  hasPerm = input.required<boolean>();

  busyCount = input(0);

  contentClass = input<string>();
}