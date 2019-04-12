import { UdcClient } from './../common/udc-watcher';
import { UdcTerminal } from './udc-terminal';
import { UdcService } from './../common/udc-service';
import { injectable, inject } from "inversify";
import { ILogger } from '@theia/core';
import { RawProcessFactory } from '@theia/process/lib/node';


@injectable()
export class UdcServiceImpl implements UdcService {
    mysecret: string;
    
    constructor(
        @inject(ILogger) protected readonly logger: ILogger,
        @inject(RawProcessFactory) protected readonly rawProcessFactory: RawProcessFactory,
        @inject(UdcTerminal) protected readonly udcTermianl: UdcTerminal,
    ) {
        this.mysecret = 'yahaha';
    }
    async test(value: string) {
        return value;
    }
    async connect(value: string): Promise<string> {
        let result = await this.udcTermianl.connect();
        return new Promise<string>(function (resolve, reject) {
            if (result) {
                resolve('connect to server succeeded')
            } else {
                reject('connect ot server failed , please retry')
            }
        })
    }

    get_devices(): Promise<{ [key: string]: number }> {
        return new Promise<{ [key: string]: number }>((resolve, reject) => {
            let re = this.udcTermianl.get_devlist();
            let flag = false;
            for (let _k in re) {
                flag = true;
                break;
            }
            if (flag) {
                resolve(re)
            } else {
                reject("Empty dev list")
            }
        }
        )
    }

    program(filepath: string,devstr:string): Promise<Boolean> {
        return new Promise<Boolean>((resolve, rejects) => {
            // console.log(filepath, " ", devstr);
            let result=this.udcTermianl.program_devices(filepath,devstr);
            resolve(result);
        }
        );
    }
    
    setClient(client:UdcClient){
        this.udcTermianl.setClient(client);
    }
}