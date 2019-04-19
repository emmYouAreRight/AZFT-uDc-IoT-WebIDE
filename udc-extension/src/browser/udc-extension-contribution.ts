import { UdcWatcher } from './../common/udc-watcher';
import { AboutDialog } from './about-dailog';
import { UdcService, LOGINTYPE } from '../common/udc-service';
import { injectable, inject } from "inversify";
import { CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry, MessageService, MAIN_MENU_BAR, Command } from "@theia/core/lib/common";
import { WorkspaceService } from "@theia/workspace/lib/browser/"
import { FileDialogService, OpenFileDialogProps } from "@theia/filesystem/lib/browser"
import { FileSystem } from '@theia/filesystem/lib/common';
import { QuickOpenService, QuickOpenModel, QuickOpenItem, QuickOpenItemOptions, SingleTextInputDialog } from '@theia/core/lib/browser';
import { UdcConsoleSession } from './udc-console-session';
import { DeviceViewService } from './device-view-service';

export const UdcExtensionCommand = {
    id: 'UdcExtension.command',
    label: "test node server"
};

export namespace UdcMenus {
    export const UDC = [...MAIN_MENU_BAR, "1_udc"];
    export const UDC_FUNCTION = [...UDC, "2_function"];
    export const UDC_ABOUT = [...UDC, "3_about"];
}

export namespace UdcCommands {
    const UDC_MENU_CATEGORY = "Udc Menu";

    export const Connect: Command = {
        id: "udc.menu.connect",
        category: UDC_MENU_CATEGORY,
        label: "connect"
    }

    export const DisConnect: Command = {
        id: "udc.menu.disconnect",
        category: UDC_MENU_CATEGORY,
        label: "disconnect"
    }

    export const GetDevList: Command = {
        id: "udc.menu.get_devlist",
        category: UDC_MENU_CATEGORY,
        label: "devlist"
    }

    export const Program: Command = {
        id: "udc.menu.program",
        category: UDC_MENU_CATEGORY,
        label: "program"
    }

    export const Reset: Command = {
        id: "udc.menu.reset",
        category: UDC_MENU_CATEGORY,
        label: "reset"
    }

    export const ABOUT: Command = {
        id: "udc.menu.about",
        category: UDC_MENU_CATEGORY,
        label: "About"
    }
}

@injectable()
export class UdcExtensionCommandContribution implements CommandContribution, QuickOpenModel {

    selectDeviceModel = "";

    async onType(lookFor: string, acceptor: (items: QuickOpenItem<QuickOpenItemOptions>[]) => void): Promise<void> {
        let items = await this.udcService.list_models()
        if (!(items.includes(lookFor)) && lookFor != '') {
            items.push(lookFor);
        }
        let opts = items.map(t =>
            new QuickOpenItem({
                label: t,
                description: t,
                run: (mode: any) => {
                    this.selectDeviceModel = t;
                    return true;
                }
            }))
        acceptor(opts);
    }

    constructor(
        @inject(MessageService) private readonly messageService: MessageService,
        @inject(UdcService) protected readonly udcService: UdcService,
        @inject(AboutDialog) private readonly aboutDialog: AboutDialog,
        @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService,
        @inject(FileDialogService) protected readonly fileDialogService: FileDialogService,
        @inject(FileSystem) protected readonly fileSystem: FileSystem,
        @inject(UdcWatcher) protected readonly udcWatcher: UdcWatcher,
        @inject(QuickOpenService) protected readonly quickOpenService: QuickOpenService,
        @inject(UdcConsoleSession) protected readonly udcConsoleSession: UdcConsoleSession,
        @inject(DeviceViewService) protected readonly deviceViewService:DeviceViewService
    ) {
        this.udcWatcher.onDeviceLog((data: string) => {
            // console.log([data]);
            let array = data.split(":");
            let log = array.slice(2).join(':').replace(/</g, "&lt;").replace(/>/g, "&gt;");
            // console.log(log);
            this.udcConsoleSession.appendLine(log);
        })

        this.udcWatcher.onDeviceList(data=>{
            this.deviceViewService.push(data)
        })
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(UdcCommands.ABOUT, {
            execute: () => {
                this.aboutDialog.open();
            }
        })

        registry.registerCommand(UdcCommands.Connect, {
            execute: async () => {
                let connected = await this.udcService.is_connected();
                if (connected === true) {
                    this.messageService.info('Already Connected');
                } else {
                    this.quickOpenService.open(this, {
                        placeholder: '请选择开发板型号或输入你的Access Key',
                        fuzzyMatchLabel: true,
                        selectIndex: (lookfor: string) => {
                            return 0;
                        },
                        onClose: async (cancel: Boolean) => {
                            if (!cancel) {
                                let device_modle = await this.udcService.list_models();
                                let login_type = LOGINTYPE.ADHOC;
                                if (!device_modle.includes(this.selectDeviceModel)) {
                                    login_type = LOGINTYPE.FIXED;
                                }
                                this.udcService.connect(login_type, this.selectDeviceModel).then(async re => {
                                    this.messageService.info(re)
                                }).catch(err => {
                                    this.messageService.error(err)
                                })
                            }
                        }
                    })
                }
            }
        })

        registry.registerCommand(UdcCommands.DisConnect, {
            execute: () => {
                this.udcService.disconnect().then(re => {
                    this.messageService.info(re)
                }).catch(err => {
                    this.messageService.error(err)
                })
            }
        })

        registry.registerCommand(UdcCommands.GetDevList, {
            execute: () => {
                this.udcService.get_devices().then(re => {
                    for (let k in re) {
                        this.messageService.info(k + " use=" + re[k]);
                    }
                })
            }
        })

        registry.registerCommand(UdcCommands.Program, {
            isEnabled: () => true,
            execute: async () => {
                let dev_list = await this.udcService.get_devices();
                let devstr = "";
                for (let k in dev_list) {
                    devstr = k;
                    break;
                }
                const props: OpenFileDialogProps = {
                    title: "选择烧写二进制文件",
                    canSelectFiles: true,
                }
                const [rootStat] = await this.workspaceService.roots;
                this.fileDialogService.showOpenDialog(props, rootStat).then(async uri => {
                    if (uri) {
                        const dialog = new SingleTextInputDialog({
                            title: 'address',
                            initialValue: '0x',
                            validate: address => address.startsWith('0x')
                        })
                        dialog.open().then(address => {
                            if (address) {
                                this.udcService.program(decodeURI(uri.toString().substring(7)), address, devstr).then(re => {
                                    if (re) {
                                        this.messageService.info("烧写成功");
                                    } else {
                                        this.messageService.info("烧写失败");
                                    }
                                }).catch(err => {
                                    console.log(err);
                                })
                            }
                        })
                    }
                }).catch(err => {
                    console.log(err);
                })
            }
        })

        registry.registerCommand(UdcCommands.Reset, {
            execute: async () => {
                let dev_list = await this.udcService.get_devices();
                let devstr = "";
                for (let k in dev_list) {
                    devstr = k;
                    break;
                }
                this.udcService.control(devstr, 'reset').then(re => {
                    let result = (re === true ? 'reset succeed' : 'reset failed')
                    this.messageService.info(result)
                }).catch(err => {
                    this.messageService.error(err)
                })
            }
        })
    }
}

@injectable()
export class UdcExtensionMenuContribution implements MenuContribution {
    registerMenus(menus: MenuModelRegistry): void {
    }
}
