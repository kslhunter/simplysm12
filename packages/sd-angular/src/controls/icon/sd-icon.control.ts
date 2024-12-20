import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  ViewEncapsulation,
} from "@angular/core";
import { type IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { SdAngularConfigProvider } from "../../providers/sd-angular-config.provider";
import { icon, type RotateProp, type SizeProp } from "@fortawesome/fontawesome-svg-core";
import { injectElementRef } from "../../utils/injectElementRef";
import { $effect } from "../../utils/$hooks";
import { transformBoolean } from "../../utils/tramsforms";

@Component({
  selector: "sd-icon",
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [],
  template: ``,
})
export class SdIconControl {
  #elRef = injectElementRef();
  #sdNgConf = inject(SdAngularConfigProvider);

  icon = input<IconDefinition>();
  size = input<SizeProp>();
  rotate = input<RotateProp>();
  fixedWidth = input(false, { transform: transformBoolean });
  stackItemSize = input<"1x" | "2x">();

  constructor() {
    $effect(() => {
      const iconDef = this.icon() ?? this.#sdNgConf.icons.fallback;
      const renderedIcon = icon(iconDef, {
        classes: [
          this.fixedWidth() ? "fa-fw" : undefined,
          this.size() != null ? `fa-${this.size()}` : undefined,
          this.rotate() != null ? `fa-rotate-${this.rotate()}` : undefined,
          this.stackItemSize() != null ? `fa-stack-${this.stackItemSize()}` : undefined,
        ].filterExists(),
      });

      this.#elRef.nativeElement.innerHTML = renderedIcon.html.join("\n");
    });
  }
}