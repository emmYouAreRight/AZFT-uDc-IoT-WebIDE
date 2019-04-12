import { TinyLinkExtensionCommandContribution ,
         TinyLinkExtensionMenuContribution,
         TinyLinkExtensionKeyBindingContribution
       } from './tinylink-extension-contribution';
import { AboutDialog,AboutDialogProps } from './about-dialog'
import { KeybindingContribution } from '@theia/core/lib/browser/keybinding';
import {
    CommandContribution,
    MenuContribution,
} from "@theia/core/lib/common";

/*
    被注释的部分尚为实验性质代码，目前在v1.0.0中暂时用不到，但是以后应该还会用，所以先注释掉了
*/

// import { YahahaViewContribution } from './yahaha-view-contribute';


// import {
//     bindViewContribution,
//     FrontendApplicationContribution,
//     createTreeContainer,
//     TreeProps,
//     TreeWidget,
//     TreeDecoratorService,
//     defaultTreeProps,
//     WidgetFactory,
// } from "@theia/core/lib/browser";

import { ContainerModule  } from "inversify";
// import { ContainerModule, interfaces } from "inversify";
// import { YahahaViewWidget } from './yahaha-view-weight';
// import { YahahaViewWidgetFactory } from './yahaha-view-weight';
// import { YahahaViewService } from './yahaha-view-service';
// import { YahahaTreeDecorator, YahahaDecoratorService} from './yahaha-decorator-service';
// import { bindContributionProvider } from '@theia/core/lib/common/contribution-provider';

export default new ContainerModule(bind => {

    bind(CommandContribution).to(TinyLinkExtensionCommandContribution);
    bind(MenuContribution).to(TinyLinkExtensionMenuContribution);
    bind(KeybindingContribution).to(TinyLinkExtensionKeyBindingContribution);
    bind(AboutDialog).toSelf().inSingletonScope();
    bind(AboutDialogProps).toConstantValue({title:'IoT'})

    // bindViewContribution(bind,YahahaViewContribution);
    // bind(FrontendApplicationContribution).to(YahahaViewContribution);

    // bind(YahahaViewWidgetFactory).toFactory(ctx=>()=>createYahahaViewWidget(ctx.container));
    // bind(YahahaViewService).toSelf().inSingletonScope();
    // bind(WidgetFactory).toService(YahahaViewService);


});

// function createYahahaViewWidget(parent :interfaces.Container): YahahaViewWidget{
//     const child=createTreeContainer(parent);
//     child.rebind(TreeProps).toConstantValue({ ...defaultTreeProps, search: true });
//     child.unbind(TreeWidget);
//     child.bind(YahahaViewWidget).toSelf();

//     child.bind(YahahaDecoratorService).toSelf().inSingletonScope();
//     child.rebind(TreeDecoratorService).toDynamicValue(ctx => ctx.container.get(YahahaDecoratorService)).inSingletonScope();
//     bindContributionProvider(child, YahahaTreeDecorator);

//     return child.get(YahahaViewWidget);
// }
