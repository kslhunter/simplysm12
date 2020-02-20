import {ChangeDetectionStrategy, Component} from "@angular/core";
import {SdModalBase} from "../providers/SdModalProvider";
import {ISdSheetColumnConfigVM} from "../controls/SdSheetControl";
import {SdSheetColumnControl} from "../controls/SdSheetColumnControl";

@Component({
  selector: "sd-sheet-config-modal",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-dock-container>
      <sd-pane class="sd-padding-default">
        <sd-sheet [items]="displayConfigs"
                  [trackByFn]="trackByKeyFn">
          <sd-sheet-column header="고정" width.px="40">
            <ng-template #cell let-item="item">
              <div style="text-align: center">
                <sd-checkbox size="sm" [(value)]="item.fixed"></sd-checkbox>
              </div>
            </ng-template>
          </sd-sheet-column>
          <sd-sheet-column header="순서" width.px="40">
            <ng-template #cell let-item="item" let-index="index">
              <div class="sd-padding-xs-sm">
                <sd-anchor [disabled]="index === 0 || (!item.fixed && !!displayConfigs[index - 1].fixed)"
                           (click)="onDisplayOrderUpButtonClick(item)">
                  <sd-icon icon="angle-up" fixedWidth></sd-icon>
                </sd-anchor>
                <sd-anchor [disabled]="index === configs.length - 1 || (item.fixed && !displayConfigs[index + 1].fixed)"
                           (click)="onDisplayOrderDownButtonClick(item)">
                  <sd-icon icon="angle-down" fixedWidth></sd-icon>
                </sd-anchor>
              </div>
            </ng-template>
          </sd-sheet-column>
          <sd-sheet-column header="헤더" resizable width.px="100">
            <ng-template #cell let-item="item">
              <sd-textfield size="sm" inset [(value)]="item.header"></sd-textfield>
            </ng-template>
          </sd-sheet-column>
          <sd-sheet-column header="너비" resizable width.px="40">
            <ng-template #cell let-item="item">
              <sd-textfield size="sm" inset [(value)]="item.widthPixel" type="number"></sd-textfield>
            </ng-template>
          </sd-sheet-column>
          <sd-sheet-column header="숨김" width.px="40">
            <ng-template #cell let-item="item">
              <div style="text-align: center">
                <sd-checkbox size="sm" [(value)]="item.hidden"
                             icon="times" theme="danger"></sd-checkbox>
              </div>
            </ng-template>
          </sd-sheet-column>
        </sd-sheet>
      </sd-pane>

      <sd-dock position="bottom" class="sd-padding-sm-default sd-padding-top-0" style="text-align: right">
        <sd-button inline theme="success" (click)="onOkButtonClick()">확인</sd-button>
        <sd-gap width="sm"></sd-gap>
        <sd-button inline (click)="onCancelButtonClick()">취소</sd-button>
      </sd-dock>
    </sd-dock-container>`,
  styles: [/* language=SCSS */ `
  `]
})
export class SdSheetConfigModal extends SdModalBase<ISdSheetConfigModalInput, { [key: string]: ISdSheetColumnConfigVM }> {
  public param!: ISdSheetConfigModalInput;

  public configs: IColumnConfigVM[] = [];

  public get displayConfigs(): IColumnConfigVM[] {
    return this.configs.orderBy(item => item.displayOrder ?? -1).orderBy(item => item.fixed ? -1 : 0);
  }

  public trackByKeyFn = (index: number, item: any) => item.key;

  public sdOnOpen(param: ISdSheetConfigModalInput): void {
    this.param = param;

    const configObj = param.configObj ?? {};

    let lastDisplayOrder = 0;
    const configs: IColumnConfigVM[] = [];
    for (const columnControl of param.controls) {
      if (columnControl.configKey) {
        const columnConfig = configObj[columnControl.configKey];

        lastDisplayOrder++;
        lastDisplayOrder = columnConfig?.displayOrder ?? lastDisplayOrder;

        configs.push({
          key: columnControl.configKey,
          header: columnConfig?.header ?? columnControl.header,
          fixed: columnConfig?.fixed ?? columnControl.fixed ?? false,
          displayOrder: lastDisplayOrder,
          widthPixel: columnConfig?.widthPixel ?? columnControl.widthPixel,
          hidden: !!columnConfig?.hidden
        });
      }
    }

    const orderedItems = configs.orderBy(item => item.displayOrder).orderBy(item => item.fixed ? -1 : 0);
    for (let i = 0; i < orderedItems.length; i++) {
      orderedItems[i].displayOrder = i;
    }

    this.configs = orderedItems;
  }

  public onDisplayOrderUpButtonClick(item: IColumnConfigVM): void {
    const displayConfigs = this.displayConfigs;

    const index = displayConfigs.indexOf(item);
    const prevItem = displayConfigs[index - 1];
    const temp = item.displayOrder;
    item.displayOrder = prevItem.displayOrder;
    prevItem.displayOrder = temp;
  }

  public onDisplayOrderDownButtonClick(item: IColumnConfigVM): void {
    const displayConfigs = this.displayConfigs;

    const index = displayConfigs.indexOf(item);
    const nextItem = displayConfigs[index + 1];
    const temp = item.displayOrder;
    item.displayOrder = nextItem.displayOrder;
    nextItem.displayOrder = temp;
  }

  public onOkButtonClick(): void {
    const result: { [key: string]: ISdSheetColumnConfigVM } = {};
    for (const config of this.configs) {
      result[config.key] = {
        widthPixel: config.widthPixel,
        displayOrder: config.displayOrder,
        fixed: config.fixed,
        header: config.header,
        hidden: config.hidden
      };
    }

    this.close(result);
  }

  public onCancelButtonClick(): void {
    this.close();
  }
}

export interface ISdSheetConfigModalInput {
  controls: SdSheetColumnControl[];
  configObj: { [key: string]: ISdSheetColumnConfigVM } | undefined;
}

interface IColumnConfigVM {
  key: string;
  header?: string;
  fixed: boolean;
  displayOrder: number;
  widthPixel?: number;
  hidden: boolean;
}