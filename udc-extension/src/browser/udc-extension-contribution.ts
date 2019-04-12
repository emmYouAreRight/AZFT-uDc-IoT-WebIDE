import { UdcWatcher } from './../common/udc-watcher';
import { AboutDialog } from './about-dailog';
import { UdcService } from '../common/udc-service';
import { injectable, inject } from "inversify";
import { CommandContribution, CommandRegistry, MenuContribution, MenuModelRegistry, MessageService, MAIN_MENU_BAR, Command } from "@theia/core/lib/common";
import { WorkspaceService } from "@theia/workspace/lib/browser/"
import { FileDialogService, OpenFileDialogProps } from "@theia/filesystem/lib/browser"
import { FileSystem } from '@theia/filesystem/lib/common';

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

    export const ABOUT: Command = {
        id: "udc.menu.about",
        category: UDC_MENU_CATEGORY,
        label: "About"
    }
}

@injectable()
export class UdcExtensionCommandContribution implements CommandContribution {

    constructor(
        @inject(MessageService) private readonly messageService: MessageService,
        @inject(UdcService) protected readonly udcService: UdcService,
        @inject(AboutDialog) private readonly aboutDialog: AboutDialog,
        @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService,
        @inject(FileDialogService) protected readonly fileDialogService: FileDialogService,
        @inject(FileSystem) protected readonly fileSystem: FileSystem,
        @inject(UdcWatcher) protected readonly udcWatcher:UdcWatcher
    ) {
        this.udcWatcher.onDeviceLog(data=>{
            this.messageService.info(data)
        })
    }

    registerCommands(registry: CommandRegistry): void {
        registry.registerCommand(UdcExtensionCommand, {
            execute: () => {
                this.udcService.test("hello").then(
                    re => {
                        this.messageService.info('node say: ' + re);
                    }
                )
            }
        });
        registry.registerCommand(UdcCommands.ABOUT, {
            execute: () => {
                this.aboutDialog.open();
            }
        })

        registry.registerCommand(UdcCommands.Connect, {
            execute: () => {
                this.udcService.connect('not decided').then(
                    re => {
                        this.messageService.info(re)
                    }
                ).catch(err=>{
                    this.messageService.error("failed please retry")
                })
            }
        })

        registry.registerCommand(UdcCommands.GetDevList, {
            execute: () => {
                this.udcService.get_devices().then(re => {
                    for (let k in re) {
                        this.messageService.info(k + " status=" + re[k]);
                    }

                })
            }
        })

        registry.registerCommand(UdcCommands.Program, {
            isEnabled:()=> true,
            execute: async () => {

                let dev_list=await this.udcService.get_devices();
                let devstr="";
                for(let k in dev_list){
                    devstr=k;
                    break;
                }
                const props: OpenFileDialogProps = {
                    title: "选择烧写二进制文件",
                    canSelectFiles: true,
                }
                const [rootStat] = await this.workspaceService.roots;
                this.fileDialogService.showOpenDialog(props, rootStat).then(async uri=>{
                    if(uri){
                        this.udcService.program(uri.toString().substring(7),devstr).then(re=>{
                            if(re){
                                this.messageService.info("烧写成功");
                            }else{
                                this.messageService.info("烧写失败");
                            }
                        }).catch(err=>{
                            console.log(err);
                        })
                    }
                }).catch(err=>{
                    console.log(err);
                    
                })
                
            }
        })
    }
}

@injectable()
export class UdcExtensionMenuContribution implements MenuContribution {
    registerMenus(menus: MenuModelRegistry): void {

        menus.registerSubmenu(UdcMenus.UDC, "UDC");

        menus.registerMenuAction(UdcMenus.UDC_FUNCTION, {
            commandId: UdcExtensionCommand.id,
            label: 'test'
        });

        menus.registerMenuAction(UdcMenus.UDC_FUNCTION, {
            commandId: UdcCommands.Connect.id,
            label: 'connect'
        })

        menus.registerMenuAction(UdcMenus.UDC_FUNCTION, {
            commandId: UdcCommands.GetDevList.id,
            label: 'getDevlist'
        })
        menus.registerMenuAction(UdcMenus.UDC_FUNCTION, {
            commandId: UdcCommands.Program.id,
            label: 'program'
        })

        menus.registerMenuAction(UdcMenus.UDC_ABOUT, {
            commandId: UdcCommands.ABOUT.id
        })


    }
}
