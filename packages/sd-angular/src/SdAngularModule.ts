import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {SdButtonControl} from "./controls/SdButtonControl";

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    SdButtonControl
  ],
  exports: [
    SdButtonControl
  ]
})
export class SdAngularModule {
}
