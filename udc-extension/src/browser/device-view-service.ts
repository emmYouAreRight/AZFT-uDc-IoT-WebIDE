import { injectable, inject } from "inversify";
import { WidgetFactory, Widget } from "@theia/core/lib/browser";
import { DeviceViewWidgetFactory, DeviceViewWidget, DeviceViewSymbolInformationNode } from "./device-view-widget";
import { DisposableCollection } from "@theia/core/lib/common/disposable";
import { Emitter } from "@theia/core/lib/common/event";

@injectable()
export class DeviceViewService implements WidgetFactory{
    id: string = 'device-view';

    protected readonly onDidChangeDeviceEmitter = new Emitter<DeviceViewSymbolInformationNode[]>();
    protected readonly onDidChangeOpenStateEmitter = new Emitter<boolean>();
    protected readonly onDidOpenEmitter = new Emitter<DeviceViewSymbolInformationNode>();
    protected readonly onDidSelectEmitter = new Emitter<DeviceViewSymbolInformationNode>();
    protected widget?: DeviceViewWidget;

    constructor(
        @inject(DeviceViewWidgetFactory) protected factory: DeviceViewWidgetFactory
    ){}

    createWidget():Promise<Widget> {
        this.widget = this.factory();
        const disposables = new DisposableCollection();
        disposables.push(this.widget.onDidChangeOpenStateEmitter.event(open => this.onDidChangeOpenStateEmitter.fire(open)));
        disposables.push(this.widget.model.onOpenNode(node => this.onDidOpenEmitter.fire(node as DeviceViewSymbolInformationNode)));
        disposables.push(this.widget.model.onSelectionChanged(selection => this.onDidSelectEmitter.fire(selection[0] as DeviceViewSymbolInformationNode)))

        this.widget.disposed.connect(()=>{
            this.widget = undefined;
            disposables.dispose();
        })
        return Promise.resolve(this.widget);
    }

    push(devices:{[key:string]:number}):void{
        if(this.widget){
            this.widget.setDevice_list(devices)
            // this.onDidChangeDeviceEmitter.fire(devices)
        }
    }

    public clearDevices():void{
        if(this.widget){
            this.widget.clearDevice();
        }
    }

}
