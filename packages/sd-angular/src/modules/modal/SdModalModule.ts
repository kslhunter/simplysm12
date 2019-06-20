import {NgModule} from "@angular/core";
import {CommonModule} from "@angular/common";
import {SdSharedModule} from "../shared/SdSharedModule";
import {SdDockModule} from "../dock/SdDockModule";
import {SdIconModule} from "../icon/SdIconModule";
import {SdLocalStorageModule} from "../local-storage/SdLocalStorageModule";
import {SdModalControl} from "./SdModalControl";
import {SdModalProvider} from "./SdModalProvider";

@NgModule({
  imports: [
    CommonModule,
    SdSharedModule,
    SdDockModule,
    SdIconModule,
    SdLocalStorageModule
  ],
  exports: [
    SdModalControl
  ],
  declarations: [
    SdModalControl
  ],
  entryComponents: [
    SdModalControl
  ],
  providers: [
    SdModalProvider
  ]
})
export class SdModalModule {
}
