import {enableProdMode} from "@angular/core";
import {platformBrowserDynamic} from "@angular/platform-browser-dynamic";
import "core-js/es7/reflect";
import "zone.js/dist/zone";

if (process.env.NODE_ENV === "production") {
    enableProdMode();
}

/*
if (module["hot"]) {
    module["hot"].accept();
}
*/

const AppModule = require("./AppModule").AppModule;
platformBrowserDynamic().bootstrapModule(AppModule);