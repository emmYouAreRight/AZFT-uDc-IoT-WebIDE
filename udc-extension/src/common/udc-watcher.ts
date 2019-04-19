import { injectable } from "inversify";
import { Emitter, Event } from "@theia/core/lib/common/event";


export const UdcClient = Symbol("UdcClient");



export interface UdcClient {
    OnDeviceLog(data: string): void,
    onDeviceList(data:{[key:string]:number}):void
}

@injectable()
export class UdcWatcher {

    protected onDeviceLogEmitter = new Emitter<string>();
    protected onDeviceListEmitter = new Emitter<{[key:string]:number}>();
    getUdcWatcherClient(): UdcClient {
        const logEmitter = this.onDeviceLogEmitter;
        const devsEmitter= this.onDeviceListEmitter;
        return {
            OnDeviceLog(data: string) {
                logEmitter.fire(data)
            },
            onDeviceList(data:{[key:string]:number}){
                devsEmitter.fire(data)
            }
        }
    }
    
    get onDeviceLog(): Event<string> {
        return this.onDeviceLogEmitter.event;
    }
    get onDeviceList():Event<{[key:string]:number}>{
        return this.onDeviceListEmitter.event
    }

}