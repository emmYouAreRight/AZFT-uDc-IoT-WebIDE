import { AbstractViewContribution, bindViewContribution, WidgetFactory } from '@theia/core/lib/browser';
import { injectable, interfaces } from "inversify";
import { ConsoleWidget, ConsoleOptions } from '@theia/console/lib/browser/console-widget';
import { ContextKey, ContextKeyService } from '@theia/core/lib/browser/context-key-service';
import { UdcConsoleSession } from './udc-console-session';

export type InUdcReplContextKey = ContextKey<boolean>;
export const InUdcReplContextKey = Symbol('inUdcReplContextKey');

@injectable()
export class UdcConsoleWidget extends ConsoleWidget{
    constructor(){
        super();
    }
    upupup():void {
        if (this.session) {
            const listener = this.content.model.onNodeRefreshed(() => {
                listener.dispose();
                this.revealLastOutput();
            });
        }
    }
}

@injectable()
export class UdcConsoleContribution extends AbstractViewContribution<UdcConsoleWidget>{
    constructor() {
        super({
            widgetId: UdcConsoleContribution.options.id,
            widgetName: UdcConsoleContribution.options.title!.label!,
            defaultWidgetOptions: {
                area: 'bottom'
            },
            toggleCommandId: 'udc:shell:toggle',
            toggleKeybinding: 'ctrlcmd+shift+c'
        });
    }
    static options: ConsoleOptions = {
        id: 'udc-shell',
        title: {
            label: 'udc shell',
            iconClass: 'theia-debug-console-icon'
        },
        input: {
            uri: UdcConsoleSession.uri,
            options: {
                autoSizing: true,
                minHeight: 1,
                maxHeight: 10,
            }
        }
    };

    static create(parent: interfaces.Container): ConsoleWidget {
        const inputFocusContextKey = parent.get<InUdcReplContextKey>(InUdcReplContextKey);
        const child = UdcConsoleWidget.createContainer(parent, {
            ...UdcConsoleContribution.options,
            inputFocusContextKey
        });
        const widget = child.get(UdcConsoleWidget);
        widget.session = child.get(UdcConsoleSession);

        return widget;
    }

    static bindContribution(bind: interfaces.Bind): void {
        bind(InUdcReplContextKey).toDynamicValue(({ container }) =>
            container.get(ContextKeyService).createKey('inUdcRepl', false)
        ).inSingletonScope();
        bind(UdcConsoleWidget).toSelf().inSingletonScope();
        bind(UdcConsoleSession).toSelf().inSingletonScope();
        bindViewContribution(bind, UdcConsoleContribution).onActivation((context, _) => {
            // eagerly initialize the debug console session
            context.container.get(UdcConsoleSession).setWidget(_.widget);
            return _;
        });
        bind(WidgetFactory).toDynamicValue(({ container }) => ({
            id: UdcConsoleContribution.options.id,
            createWidget: () => UdcConsoleContribution.create(container)
        }));
    }
}