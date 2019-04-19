import { injectable, inject } from "inversify";
import { ConsoleSession, ConsoleItem } from "@theia/console/lib/browser/console-session";
import URI from "@theia/core/lib/common/uri";
import { Workspace, Languages, MessageType } from "@theia/languages/lib/browser";
import { UdcService } from "../common/udc-service";
import { AnsiConsoleItem } from '@theia/console/lib/browser/ansi-console-item';
import { UdcConsoleWidget } from "./udc-console-contribution";


@injectable()
export class UdcConsoleSession extends ConsoleSession {
    static uri = new URI().withScheme('udcconsole');
    readonly id = 'udc';
    protected items: ConsoleItem[] = [];
    protected consoleWidget: Promise<UdcConsoleWidget> | undefined = undefined

    constructor(
        @inject(Languages) protected readonly languages: Languages,
        @inject(Workspace) protected readonly workspace: Workspace,
        @inject(UdcService) protected readonly udcService: UdcService,
    ) {
        super();
    }

    getElements(): IterableIterator<ConsoleItem> {
        return this.items[Symbol.iterator]();
    }

    async execute(cmd: string): Promise<void> {

        if (cmd === '' || cmd === null || cmd === undefined) {
            return;
        }
        // this.items.push(new AnsiConsoleItem(cmd, MessageType.Log))
        // this.fireDidChange()
        let errorHandler = (err: any) => {
            console.log(err);
        }
        this.udcService.get_devices().then(async dev_list => {
            let devstr = "";
            for (let k in dev_list) {
                devstr = k;
                break;
            }
            await this.udcService.rumcmd(devstr, cmd)
        }).catch(errorHandler)
    }

    async appendLine(value: string): Promise<void> {
        this.items.push(new AnsiConsoleItem(value, MessageType.Log))
        this.fireDidChange()
        if (this.consoleWidget) {
            try {
                let thewidget = await this.consoleWidget;
                thewidget.upupup();
                
            } catch (err) {
                console.log(err);
            }
        }
    }

    clear(): void {
        this.items = []
        this.fireDidChange();
    }

    protected fireDidChange(): void {
        this.onDidChangeEmitter.fire(undefined);
    }

    public setWidget(widget: Promise<UdcConsoleWidget>) {
        this.consoleWidget = widget
    }

}