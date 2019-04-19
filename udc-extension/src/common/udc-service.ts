
export const udcServicePath = "/services/udcserver";
export const UdcService = Symbol('UdcService');

export enum LOGINTYPE { ADHOC = 'adhoc', FIXED = 'fixed' }

export interface UdcService {

    is_connected(): Promise<Boolean>;
    connect(type: LOGINTYPE, model: string): Promise<string>;
    disconnect(): Promise<string>;

    list_models(): Promise<Array<string>>;
    get_devices(): Promise<{ [key: string]: number }|undefined>;

    program(uri: string,address:string, devstr: string): Promise<Boolean>;
    rumcmd(devstr:string,cmdstr:string):Promise<Boolean>;
    control(devstr:string, operation:string):Promise<Boolean>;
}



