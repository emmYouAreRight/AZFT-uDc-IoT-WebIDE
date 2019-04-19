import { UdcConsoleContribution } from './udc-console-contribution';
import { DeviceViewDecoratorService, DeviceTreeDecorator } from './decorator-view-service';
import { UdcWatcher } from './../common/udc-watcher';
import { UdcService } from './../common/udc-service';
import { AboutDialog, AboutDialogProps } from './about-dailog';

import { UdcExtensionCommandContribution, UdcExtensionMenuContribution } from './udc-extension-contribution';
import {
    CommandContribution,
    MenuContribution,
    bindContributionProvider
} from "@theia/core/lib/common";

import { ContainerModule, interfaces } from "inversify";
import {  udcServicePath } from '../common/udc-service';
import { WebSocketConnectionProvider, createTreeContainer, TreeProps, defaultTreeProps, TreeWidget, bindViewContribution, FrontendApplicationContribution, WidgetFactory, TreeDecoratorService } from '@theia/core/lib/browser';
import { createCommonBindings } from '../common/udc-common-module';
import { DeviceViewWidgetFactory, DeviceViewWidget } from './device-view-widget';
import { DeviceViewContribution } from './devices-view-contribution';
import { DeviceViewService } from './device-view-service';
import '../../src/browser/styles/index.css';

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
    
    bind(DeviceViewWidgetFactory).toFactory(ctx=>()=>createDeviceViewWeiget(ctx.container));
    bind(DeviceViewService).toSelf().inSingletonScope();
    bind(WidgetFactory).toService(DeviceViewService);
    bindViewContribution(bind,DeviceViewContribution);
    bind(FrontendApplicationContribution).toService(DeviceViewContribution);

    UdcConsoleContribution.bindContribution(bind);

});


function createDeviceViewWeiget(parent: interfaces.Container):DeviceViewWidget{
    const child = createTreeContainer(parent);
    child.rebind(TreeProps).toConstantValue({... defaultTreeProps, search:true});

    child.unbind(TreeWidget);
    child.bind(DeviceViewWidget).toSelf();

    child.bind(DeviceViewDecoratorService).toSelf().inSingletonScope();
    child.rebind(TreeDecoratorService).toDynamicValue(ctx=>ctx.container.get(DeviceViewDecoratorService)).inSingletonScope();
    bindContributionProvider(child,DeviceTreeDecorator)
    return child.get(DeviceViewWidget);

}
