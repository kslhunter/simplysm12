import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  HostListener,
  inject,
  input,
  ViewEncapsulation,
} from "@angular/core";
import { SdTopbarContainerControl } from "./SdTopbarContainerControl";
import { SdSidebarContainerControl } from "./SdSidebarContainerControl";
import { ISdResizeEvent } from "../plugins/SdResizeEventPlugin";
import { SdAnchorControl } from "./SdAnchorControl";
import { SdGapControl } from "./SdGapControl";
import { SdAngularConfigProvider } from "../providers/SdAngularConfigProvider";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import { $computed } from "../utils/$hooks";
import { injectElementRef } from "../utils/injectElementRef";

@Component({
  selector: "sd-topbar",
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [SdAnchorControl, SdGapControl, FaIconComponent],
  styles: [
    /* language=SCSS */ `
      @import "../scss/mixins";

      sd-topbar {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        gap: var(--gap-default);
        align-items: center;
        justify-content: start;
        //white-space: nowrap;

        position: absolute;
        z-index: var(--z-index-topbar);
        top: 0;
        left: 0;
        width: 100%;
        height: var(--topbar-height);
        overflow-x: auto;
        overflow-y: hidden;
        //line-height: var(--topbar-height);
        user-select: none;

        background: var(--background-color);
        color: var(--text-trans-default);

        body.sd-theme-compact &,
        body.sd-theme-modern & {
          //border-bottom: 1px solid var(--border-color-light);
          @include elevation(2);
          animation: sd-topbar var(--animation-duration) ease-in;
        }

        /*> ._nav {
        display: inline-block;
        height: var(--topbar-height);s
        white-space: nowrap;
        vertical-align: top;
      }*/

        @each $h in (h1, h2, h3, h4, h5, h6) {
          > #{$h} {
            //display: inline-block;
            //vertical-align: top;
            //line-height: var(--topbar-height);
            //margin-right: var(--gap-xxl);
            padding-right: var(--gap-xl);
          }
        }

        &::-webkit-scrollbar-track {
          background-color: rgba(0, 0, 0, 0.1);
        }

        &::-webkit-scrollbar-corner {
          background-color: rgba(0, 0, 0, 0.1);
        }

        &::-webkit-scrollbar {
          width: var(--gap-sm);
          height: var(--gap-sm);
          background-color: rgba(0, 0, 0, 0);
        }

        &::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
        }

        > ._sidebar-toggle-button {
          //display: inline-block;
          //vertical-align: top;
          text-align: center;
          //margin-right: var(--gap-default);
          cursor: pointer;
          line-height: var(--topbar-height);

          min-width: var(--topbar-height);
          font-size: var(--font-size-h4);

          color: var(--theme-primary-default);

          @include active-effect(true);

          &:hover {
            background: transparent;
            color: var(--theme-primary-darker);
          }
        }

        /*> ._menu {
        display: flex;
        flex-wrap: nowrap;
        flex-direction: row;
        gap: var(--gap-sm);

        body.sd-theme-mobile &,
        body.sd-theme-kiosk & {
          float: right;
        }
      }*/
      }

      @keyframes sd-topbar {
        from {
          opacity: 0;
          transform: translateY(-1em);
        }
      }
    `,
  ],
  template: `
    @if (hasSidebar()) {
      <sd-anchor class="_sidebar-toggle-button" (click)="onSidebarToggleButtonClick()">
        <fa-icon [icon]="icons.bars" [fixedWidth]="true" />
      </sd-anchor>
    } @else {
      <sd-gap width="default" />
    }

    <ng-content />
  `,
})
export class SdTopbarControl {
  icons = inject(SdAngularConfigProvider).icons;

  #elRef = injectElementRef<HTMLElement>();
  #parentSidebarContainerControl = inject(SdSidebarContainerControl, { optional: true });
  #topbarContainerControl = inject<SdTopbarContainerControl>(forwardRef(() => SdTopbarContainerControl));

  sidebarContainer = input<SdSidebarContainerControl>();

  hasSidebar = $computed(() => !!this.sidebarContainer() || !!this.#parentSidebarContainerControl);

  onSidebarToggleButtonClick() {
    const sidebarContainerControl = this.sidebarContainer() ?? this.#parentSidebarContainerControl;
    sidebarContainerControl!.toggle.update((v) => !v);
  }

  @HostListener("sdResize", ["$event"])
  onResize(event: ISdResizeEvent) {
    if (!event.heightChanged) return;
    this.#topbarContainerControl.paddingTop.set(this.#elRef.nativeElement.offsetHeight + "px");
  }
}
