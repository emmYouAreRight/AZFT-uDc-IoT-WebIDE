import { injectable } from "inversify";
import { AbstractViewContribution, FrontendApplicationContribution, FrontendApplication } from "@theia/core/lib/browser";
import { DeviceViewWidget } from "./device-view-widget";


export const DEVICE_WIDGET_FACTORY_ID = 'device-view'

@injectable()
export class DeviceViewContribution extends AbstractViewContribution<DeviceViewWidget> implements FrontendApplicationContribution{

    constructor(){
        super({
            widgetId: DEVICE_WIDGET_FACTORY_ID,
            widgetName: 'Devices',
            defaultWidgetOptions:{
                area:'left',
                rank:500
            },
            toggleCommandId:'UDC devices'
        })
    }

    async initializeLayout(app: FrontendApplication):Promise<void>{
        await this.openView();
    }
}
