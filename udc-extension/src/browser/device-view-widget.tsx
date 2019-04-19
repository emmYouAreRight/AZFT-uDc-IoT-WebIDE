import { injectable, inject } from "inversify";
import { TreeWidget, TreeProps, TreeModel, ContextMenuRenderer, CompositeTreeNode, SelectableTreeNode, TreeNode } from "@theia/core/lib/browser";
import React = require("react");
import { Emitter } from "vscode-jsonrpc";
import { UdcService } from "../common/udc-service";
import { MessageService, CommandRegistry } from "@theia/core";
import { UdcCommands } from "./udc-extension-contribution";

export interface DeviceViewSymbolInformationNode extends CompositeTreeNode, SelectableTreeNode {
    iconClass: string;
}

export namespace DeviceViewSymbolInformationNode {
    export function is(node: TreeNode): node is DeviceViewSymbolInformationNode {
        return !!node && SelectableTreeNode.is(node) && 'iconClass' in node;
    }
}

export namespace DeviceItem {
    export interface Props {
        dev_str: string,
        model_type: string,
        model_id: string,
        using_or_not: number,
        hub_id: string,
        reset: () => void,
        program: () => void,
        openshell: () => void,
        start: () => void,
        stop: () => void
    }
}

export class DeviceItem extends React.Component<DeviceItem.Props>{

  
    protected readonly reset = () => this.props.reset()
    protected readonly program = () => this.props.program()
    protected readonly openshell = () => this.props.openshell()
    render() {
        const { dev_str, model_type, model_id, using_or_not, hub_id } = this.props
        const blockdisplay = {
            display: 'block'
        }
        return <div className={`deviceItem ${dev_str}`}>
            <div className='deviceInfo' style={blockdisplay}>
                <span className='model_type' >model_type: {model_type}</span>
                <span className='model_id'>model_id: {model_id}</span>
                <span className='hub_id'>hub_id: {hub_id}</span>
                <span className='using_or_not'>status: {using_or_not}</span>
            </div>
            <div className='itemButtonsContainer'>
                {this.renderDeviceItemButtons()}
            </div>
        </div>
    }

    protected renderDeviceItemButtons(): React.ReactNode {
        return <div className='buttons'>
            <a className='toolbar-button' title='reset' onClick={() => this.reset()}>
                <i className='open-file' />
            </a>
            <a className='toolbar-button' title='program' onClick={() => this.program()}>
                <i className='open-file' />
            </a>

            <a className='toolbar-button' title='shell' onClick={() => this.openshell()}>
                <i className='theia-debug-console-icon' />
                {/* <div className='p-TabBar-tabIcon theia-debug-console-icon' /> */}
            </a>
        </div>
    }
}

export type DeviceViewWidgetFactory = () => DeviceViewWidget;
export const DeviceViewWidgetFactory = Symbol('DeviceViewWidgetFactory')

@injectable()
export class DeviceViewWidget extends TreeWidget {

    readonly onDidChangeOpenStateEmitter = new Emitter<boolean>();
    device_list?: { [key: string]: number } 

    constructor(
        @inject(TreeProps) protected readonly treePros: TreeProps,
        @inject(TreeModel) model: TreeModel,
        @inject(ContextMenuRenderer) protected readonly contextMenuRenderer: ContextMenuRenderer,
        @inject(UdcService) protected readonly udcService: UdcService,
        @inject(MessageService) protected readonly messageService: MessageService,
        @inject(CommandRegistry) protected readonly commandRegistry: CommandRegistry
    ) {
        super(treePros, model, contextMenuRenderer);
        this.id = 'device-view';
        this.title.label = "Remote Device";
        this.title.caption = "Device";
        this.title.closable = true;
        this.title.iconClass = 'fa outline-view-tab-icon';
        this.addClass('theia-udcdevice-view');
        this.refresh_devices()
    }

    protected async refresh_devices() {
        try {
            this.device_list = await this.udcService.get_devices()
            this.update()
        } catch (err) {
            this.device_list = undefined
        }
    }

    public setDevice_list(devices:{[key:string]:number}){
        this.device_list=devices;
        this.update()
    }

    public clearDevice():void{
        this.device_list=undefined
        this.update()
    }
   
    protected renderTree(): React.ReactNode {
        let l = [];
        for (let i in this.device_list) {
            let dev_str = i;
            // console.log(dev_str);
            let arr = dev_str.match(/[A-Za-z0-9]*/g);
            if (arr === null) continue;
            arr = arr.filter(e => e != "" && e != null)
            let [hub_id, , model_type, model_id] = arr;
            // console.log('as below', hub_id, model_type, model_id);
            l.push(<DeviceItem
                key={dev_str}
                dev_str={dev_str}
                hub_id={hub_id}
                model_type={model_type}
                model_id={model_id}
                using_or_not={this.device_list[i]}
                reset={this.reset}
                program={this.program}
                openshell={this.openShell}
                start={() => this.messageService.info('start')}
                stop={() => this.messageService.info('stop')} />)
        }
        return <div id='device-view-widget'>
            {/* <div className="deviceview-selection">
                <select className="connect-type">
                    <option>{LOGINTYPE.ADHOC}</option>
                    <option>{LOGINTYPE.FIXED}</option>
                </select>
                <select className="modle-type">
                    <option>any</option>
                    <option>{LOGINTYPE.FIXED}</option>
                </select>
            </div>
            <div className="key-input">
                <input style={{display:'block'}} type="text" name="key" />
            </div> */}
            <div className="buttons">
               {this.renderConnectArea()}
            </div>
            <div id='Device-Item-Container'>{l}</div>
        </div>
    }


    protected renderConnectArea():React.ReactNode{
        if(this.device_list){
            return  <button onClick={this.disconnect}>DisConnect</button>
        }else{
            return  <button onClick={this.connect}>Connect</button>   
        }
    }

    connect = () => {
        this.commandRegistry.executeCommand(UdcCommands.Connect.id);
    }

    disconnect = () => {
        this.commandRegistry.executeCommand(UdcCommands.DisConnect.id)
        this.clearDevice();
    }
    program = () => {
        this.commandRegistry.executeCommand(UdcCommands.Program.id)
    }
    reset = () => {
        this.commandRegistry.executeCommand(UdcCommands.Reset.id)
    }
    openShell = () => {
        this.messageService.info('shell')
    }

}
