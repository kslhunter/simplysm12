import { Directive, output } from "@angular/core";
import { ISdResizeEvent } from "../plugins/SdResizeEventPlugin";

@Directive({
  selector: "[sdResize], [invalid.capture]",
  standalone: true,
})
export class SdEventsDirective {
  sdResize = output<ISdResizeEvent>();
  invalidCapture = output<Event>({ alias: "invalid.capture" });
}
