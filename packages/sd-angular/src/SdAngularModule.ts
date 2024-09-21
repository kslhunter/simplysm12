import {
  ErrorHandler,
  inject,
  ModuleWithProviders,
  NgModule,
  provideExperimentalZonelessChangeDetection,
} from "@angular/core";
import { EVENT_MANAGER_PLUGINS } from "@angular/platform-browser";
import { SdSaveCommandEventPlugin } from "./plugins/SdSaveCommandEventPlugin";
import { SdRefreshCommandEventPlugin } from "./plugins/SdRefreshCommandEventPlugin";
import { SdInsertCommandEventPlugin } from "./plugins/SdInsertCommandEventPlugin";
import { SdResizeEventPlugin } from "./plugins/SdResizeEventPlugin";
import { SdGlobalErrorHandlerPlugin } from "./plugins/SdGlobalErrorHandlerPlugin";
import { SdOptionEventPlugin } from "./plugins/SdOptionEventPlugin";
import { FaConfig } from "@fortawesome/angular-fontawesome";
import { ISdAngularIcon, SdAngularConfigProvider } from "./providers/SdAngularConfigProvider";
import { SdThemeProvider } from "./providers/SdThemeProvider";
import { SdLocalStorageProvider } from "./providers/SdLocalStorageProvider";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { SdBackbuttonEventPlugin } from "./plugins/SdBackbuttonEventPlugin";
import {
  faAngleDoubleLeft,
  faAngleDoubleRight,
  faAngleDown,
  faAngleLeft,
  faAngleRight,
  faAngleUp,
  faArrowLeft,
  faArrowRight,
  faBars,
  faCaretDown,
  faCaretRight,
  faCheck,
  faCode,
  faCog,
  faEdit,
  faExternalLink,
  faEye,
  faMinus,
  faMountainSun,
  faPen,
  faPlus,
  faQuestion,
  faQuestionCircle,
  faSave,
  faSearch,
  faSort,
  faSortDown,
  faSortUp,
  faStar,
  faTriangleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

@NgModule({
  imports: [],
})
export class SdAngularModule {
  #sdNgConf = inject(SdAngularConfigProvider);
  #faConfig = inject(FaConfig);
  #sdTheme = inject(SdThemeProvider);
  #sdLocalStorage = inject(SdLocalStorageProvider);

  constructor() {
    this.#faConfig.fallbackIcon = this.#sdNgConf.fallbackIcon;
    this.#sdTheme.theme = this.#sdLocalStorage.get("sd-theme") ?? this.#sdNgConf.defaultTheme;
  }

  static forRoot(opt?: {
    clientName?: string;
    defaultTheme?: "compact" | "modern" | "mobile" | "kiosk";
    fallbackIcon?: IconDefinition;
    icons?: ISdAngularIcon;
  }): ModuleWithProviders<SdAngularModule> {
    return {
      ngModule: SdAngularModule,
      providers: [
        {
          provide: SdAngularConfigProvider,
          useFactory: () => {
            const provider = new SdAngularConfigProvider();
            provider.clientName = opt?.clientName ?? "unknown";
            provider.defaultTheme = opt?.defaultTheme ?? "modern";
            provider.fallbackIcon = opt?.fallbackIcon ?? faQuestionCircle;
            provider.icons = opt?.icons ?? {
              caretDown: faCaretDown,
              code: faCode,
              eye: faEye,
              pen: faPen,
              angleDown: faAngleDown,
              question: faQuestion,
              triangleExclamation: faTriangleExclamation,
              angleDoubleLeft: faAngleDoubleLeft,
              angleDoubleRight: faAngleDoubleRight,
              angleLeft: faAngleLeft,
              angleRight: faAngleRight,
              cog: faCog,
              arrowLeft: faArrowLeft,
              arrowRight: faArrowRight,
              caretRight: faCaretRight,
              save: faSave,
              star: faStar,
              mountainSun: faMountainSun,
              bars: faBars,
              angleUp: faAngleUp,
              questionCircle: faQuestionCircle,

              check: faCheck,
              minus: faMinus,
              plus: faPlus,
              xmark: faXmark,
              sort: faSort,
              sortDown: faSortDown,
              sortUp: faSortUp,

              search: faSearch,
              externalLink: faExternalLink,
              edit: faEdit,
            };
            return provider;
          },
        },
        { provide: EVENT_MANAGER_PLUGINS, useClass: SdSaveCommandEventPlugin, multi: true },
        { provide: EVENT_MANAGER_PLUGINS, useClass: SdRefreshCommandEventPlugin, multi: true },
        { provide: EVENT_MANAGER_PLUGINS, useClass: SdInsertCommandEventPlugin, multi: true },
        { provide: EVENT_MANAGER_PLUGINS, useClass: SdResizeEventPlugin, multi: true },
        { provide: EVENT_MANAGER_PLUGINS, useClass: SdOptionEventPlugin, multi: true },
        { provide: EVENT_MANAGER_PLUGINS, useClass: SdBackbuttonEventPlugin, multi: true },
        { provide: ErrorHandler, useClass: SdGlobalErrorHandlerPlugin },
        provideExperimentalZonelessChangeDetection(),
      ],
    };
  }
}
