import { injectable } from "inversify";
import { Emitter, Event } from "@theia/core/lib/common/event";


export const UdcClient = Symbol("UdcClient");
export interface UdcClient {
    OnDeviceLog(data: string): void
}

@injectable()
export class UdcWatcher {

    protected onDeviceLogEmitter = new Emitter<string>();

    getUdcWatcherClient(): UdcClient {
        const logEmitter = this.onDeviceLogEmitter;
        return {
            OnDeviceLog(data: string) {
                logEmitter.fire(data)
            }
        }
    }

    get onDeviceLog(): Event<string> {
        return this.onDeviceLogEmitter.event;
    }

}