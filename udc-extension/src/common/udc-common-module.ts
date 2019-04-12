import { UdcWatcher } from './udc-watcher';
import { interfaces } from "inversify";

export function createCommonBindings(bind:interfaces.Bind){
    bind(UdcWatcher).toSelf().inSingletonScope();
}