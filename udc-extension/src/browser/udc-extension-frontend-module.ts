import { UdcWatcher } from './../common/udc-watcher';
import { UdcService } from './../common/udc-service';
import { AboutDialog, AboutDialogProps } from './about-dailog';
/**
 * Generated using theia-extension-generator
 */

import { UdcExtensionCommandContribution, UdcExtensionMenuContribution } from './udc-extension-contribution';
import {
    CommandContribution,
    MenuContribution
} from "@theia/core/lib/common";

import { ContainerModule, interfaces } from "inversify";
import {  udcServicePath } from '../common/udc-service';
import { WebSocketConnectionProvider } from '@theia/core/lib/browser';
import { createCommonBindings } from '../common/udc-common-module';

export default new ContainerModule((bind: interfaces.Bind) => {

    bind(CommandContribution).to(UdcExtensionCommandContribution);
    bind(MenuContribution).to(UdcExtensionMenuContribution);
   
    bind(UdcService).toDynamicValue(ctx => {
        const provider = ctx.container.get(WebSocketConnectionProvider);
        const udcWatcher =ctx.container.get(UdcWatcher);
        return provider.createProxy<UdcService>(udcServicePath,udcWatcher.getUdcWatcherClient());
    }).inSingletonScope();
    createCommonBindings(bind);
    bind(AboutDialog).toSelf().inSingletonScope();
    bind(AboutDialogProps).toConstantValue({ title: 'UDC' })
});