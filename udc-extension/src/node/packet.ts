import { injectable } from 'inversify';
import * as fs from 'fs-extra';
import * as crypto from "crypto";

@injectable()
export class Packet{
        constructor(){
        }
        is_valid_type(type :string):boolean{
            if(Packet.packet_type[type]!==""){
                return true;
            }else{
                return false;
            }
        }
        construct(type:string ,value:string): string {
            if(!this.is_valid_type(type)){
                return ''
            }else if(value.length>99999){ 
                console.log('warning: data size larger than permited');
                return ''
            }else{
                let frame='{'+type+','+value.length.toString().padStart(5,'0')+','+value+'}';
                // console.log('Send:', frame);
                return frame
            }
        }

        parse(msg:string):Array<any>{
            // console.log(msg);
            if (msg.length<13){
                return [Packet.packet_type.TYPE_NONE,0,'',msg]
            }

            let sync=false;
            let type='';
            let Length=0;
            let value='';

            for(let i =0;i<msg.length-12;i++){
                if(msg[i]!='{'){
                    continue;
                }
                type=msg.substring(i+1,i+5);
                if(this.is_valid_type(type)===false){
                    continue;
                }
                if(msg[i+5]!=','){
                    continue
                }
                let length = msg.substring(i+6,i+11);
                Length=Number(length);
                if(msg[i+11]!=','){
                    continue;
                }
                if (i+Length+13> msg.length){
                    msg=msg.substring(i);
                    break;
                }
                if(msg[i+Length+12]!='}'){
                    continue;
                }
                value=msg.substring(i+12,i+Length+12);
                sync=true;

                msg=msg.substring(i+Length+13)
                break;
            }
            if(sync===false){
                return [Packet.packet_type.TYPE_NONE,0,'',msg]
            }else{
                return [type,Length,value,msg];
            }
        }

    async hash_of_file(filename: string) {
        crypto.createHash('sha1');
        let h= crypto.createHash('sha1');
        let fd= await fs.readFileSync(filename);
        h.update(fd);
        return h.digest('hex');
    }
}

export namespace Packet{
    export const TYPE_NONE = 'NONE'
    export const CLIENT_DEV     = 'CDEV'
    export const ALL_DEV        = 'ADEV'
    export const DEVICE_LOG     = 'DLOG'
    export const DEVICE_STATUS  = 'DSTU'
    export const DEVICE_CMD     = 'DCMD'
    export const DEVICE_ERASE   = 'DERS'
    export const DEVICE_PROGRAM = 'DPRG'
    export const DEVICE_RESET   = 'DRST'
    export const DEVICE_START   = 'DSTR'
    export const DEVICE_STOP    = 'DSTP'
    export const DEVICE_ALLOC   = 'DALC'
    export const DEVICE_DEBUG_START   = 'DDBS'
    export const DEVICE_DEBUG_DATA    = 'DDBD'
    export const DEVICE_DEBUG_REINIT  = 'DDBR'
    export const DEVICE_DEBUG_STOP    = 'DDBE'
    export const LOG_SUB        = 'LGSB'
    export const LOG_UNSUB      = 'LGUS'
    export const STATUS_SUB     = 'STSB'
    export const STATUS_UNSUB   = 'STUS'
    export const LOG_DOWNLOAD   = 'LGDL'
    export const FILE_BEGIN     = 'FBGN'
    export const FILE_DATA      = 'FDTA'
    export const FILE_END       = 'FEND'
    export const CMD_DONE       = 'CMDD'
    export const CMD_ERROR      = 'CMDE'
    export const HEARTBEAT      = 'HTBT'
    export const CLIENT_LOGIN   = 'CLGI'
    export const TERMINAL_LOGIN = 'TLGI'
    export const ACCESS_LOGIN   = 'ALGI'
    export const ACCESS_REPORT_STATUS = 'ARPS'
    export const ACCESS_ADD_CLIENT    = 'AADC'
    export const ACCESS_DEL_CLIENT    = 'ADLC'
    export const ACCESS_ADD_TERMINAL  = 'AADT'
    export const ACCESS_UPDATE_TERMINAL = 'AUPT'
    export const ACCESS_DEL_TERMINAL  = 'ADLT'

    export const packet_type :{[key:string]:string}={
        TYPE_NONE            : 'NONE',
        CLIENT_DEV           : 'CDEV',
        ALL_DEV              : 'ADEV',
        DEVICE_LOG           : 'DLOG',
        DEVICE_STATUS        : 'DSTU',
        DEVICE_CMD           : 'DCMD',
        DEVICE_ERASE         : 'DERS',
        DEVICE_PROGRAM       : 'DPRG',
        DEVICE_RESET         : 'DRST',
        DEVICE_START         : 'DSTR',
        DEVICE_STOP          : 'DSTP',
        DEVICE_ALLOC         : 'DALC',
        DEVICE_DEBUG_START   : 'DDBS',
        DEVICE_DEBUG_DATA    : 'DDBD',
        DEVICE_DEBUG_REINIT  : 'DDBR',
        DEVICE_DEBUG_STOP    : 'DDBE',
        LOG_SUB              : 'LGSB',
        LOG_UNSUB            : 'LGUS',
        STATUS_SUB           : 'STSB',
        STATUS_UNSUB         : 'STUS',
        LOG_DOWNLOAD         : 'LGDL',
        FILE_BEGIN           : 'FBGN',
        FILE_DATA            : 'FDTA',
        FILE_END             : 'FEND',
        CMD_DONE             : 'CMDD',
        CMD_ERROR            : 'CMDE',
        HEARTBEAT            : 'HTBT',
        CLIENT_LOGIN         : 'CLGI',
        TERMINAL_LOGIN       : 'TLGI',
        ACCESS_LOGIN         : 'ALGI',
        ACCESS_REPORT_STATUS : 'ARPS',
        ACCESS_ADD_CLIENT    : 'AADC',
        ACCESS_DEL_CLIENT    : 'ADLC',
        ACCESS_ADD_TERMINAL  : 'AADT',
        ACCESS_UPDATE_TERMINAL : 'AUPT',
        ACCESS_DEL_TERMINAL  : 'ADLT',
    }
}