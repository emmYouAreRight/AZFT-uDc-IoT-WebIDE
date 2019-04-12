
export const udcServicePath="/services/udcserver";
export const UdcService = Symbol('UdcService');

export interface UdcService {
    test(value:string):Promise<string>;
    connect(value:string):Promise<string>;
    get_devices():Promise<{[key:string]:number}>;
    program(uri:string,devstr:string):Promise<Boolean>;
}
