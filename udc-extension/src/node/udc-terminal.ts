import { certificate } from './../common/udc-config';
import { UdcClient } from './../common/udc-watcher';
import { injectable, inject } from "inversify";
import * as tls from 'tls';
import * as fs from 'fs-extra';
import { Packet } from "./packet";
import * as events from "events";
import https = require('https');

import { networkInterfaces } from 'os';
import { LOGINTYPE } from '../common/udc-service';

@injectable()
export class UdcTerminal {
    udcserver: any;
    DEFAULT_SERVER: string = "118.31.76.36";
    DEFAULT_PORT: number = 2000;

    udcControlerClient: any = null;
    model: string = "esp8266";
    login_type: LOGINTYPE = LOGINTYPE.ADHOC
    dev_list?: { [key: string]: number } 
    cmd_excute_state = "idle"
    cmd_excute_return: any = ""
    udcServerClient: any = null
    udcClient?: UdcClient
    events = new events.EventEmitter();
    event: any

    constructor(
        @inject(Packet) protected readonly pkt: Packet,
    ) {
        this.event = new events.EventEmitter();
    }

    setClient(client: UdcClient) {
        this.udcClient = client;
    }

    get uuid(): string {
        let uuid: string = '';
        let interfaces = networkInterfaces();
        for (let intf in interfaces) {
            for (let i in interfaces[intf]) {
                if (interfaces[intf][i].family === 'IPv6') { continue; }
                if (interfaces[intf][i].address === '127.0.0.1') { break; }
                uuid = interfaces[intf][i].mac.replace(/:/g, '') + '0000'
                break;
            }
        }
        return uuid;
    }


    login_and_get_server(login_type: LOGINTYPE, model: string): Promise<Array<any>> {
        this.model = model;
        this.login_type = login_type;

        const data = JSON.stringify({
            uuid: login_type === LOGINTYPE.ADHOC ? this.uuid : model,
            type: login_type,
            model: login_type === LOGINTYPE.ADHOC ? model : "any",
        })

        let options = {
            host: '118.31.76.36',
            port: 8080,
            path: '/terminal/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
            },
            cert: certificate,
            rejectUnauthorized: false,
        }

        return new Promise((resolve, reject) => {
            let req = https.request(options, function (res) {
                res.on('data', (d: Buffer) => {
                    let result = JSON.parse(d.toString('ascii'));
                    if (result.result === "success") {
                        let ret = [result.result, result.host, result.port, result.token, result.certificate]
                        resolve(ret)
                    } else {
                        reject(result.message)
                    }
                })
                res.on('error', (err) => {
                    console.log(err);
                    reject('api call failed')
                })
            });
            req.write(data);
            req.end();
        })
    }

    async connect_to_server(server_ip: string, server_port: number, certificate: string): Promise<string> {
        let options = {
            ca: certificate,
            rejectUnauthorized: false,
            requestCert: false,
        }

        let _this = this;
        return new Promise(function (resolve, reject) {
            _this.udcServerClient = tls.connect(server_port, server_ip, options, () => {
                resolve('success')
            })
            _this.udcServerClient.on('error', () => {
                reject('fail')
            });
            _this.udcServerClient.on('close', () => {
                console.log('Connection to Udc Server Closed!');
            });
            _this.udcServerClient.on('data', _this.onUdcServerData);

            _this.udcServerClient.setTimeout(10000);
            _this.udcServerClient.on('timeout', () => {
                _this.send_packet(Packet.HEARTBEAT, '');
            })
        })
    }

    onUdcServerData = (data: Buffer) => {
        // let [type, length, value, msg] = this.pkt.parse(data.toString('ascii'));
        let [type, , value] = this.pkt.parse(data.toString('ascii'));
        // console.log(`Received: type=${type} length=${length} value= ${value} msg=${msg}`);

        if (type === Packet.ALL_DEV) {
            let new_dev_list: { [key: string]: number } = {}
            let clients = value.split(':');
            for (let c of clients) {
                if (c === '') { continue; }
                let info = c.split(',');
                let uuid = info[0];
                let devs = info.slice(1);
                for (let d of devs) {
                    if (d === '') { continue; }
                    let [dev, using] = d.split('|')
                    new_dev_list[uuid + ',' + dev] = using
                }
            }
            this.dev_list = new_dev_list;

            if(this.udcClient){
                this.udcClient.onDeviceList(new_dev_list)
            }

        } else if (type === Packet.DEVICE_STATUS) {
        } else if (type === Packet.TERMINAL_LOGIN) {
            if (value === 'success') {
                console.log('server login success');
            } else {
                console.log('login failed retrying ...');
                this.connect(this.login_type, this.model)
            }
        } else if (type === Packet.CMD_DONE || type === Packet.CMD_ERROR) {
            console.log(data.toString('ascii'));
            this.cmd_excute_return = value;
            this.cmd_excute_state = (type === Packet.CMD_DONE ? 'done' : 'error');
            this.events.emit('cmd-response');
        } else if (type == Packet.DEVICE_LOG) {
            if (this.udcClient) {
                this.udcClient.OnDeviceLog(value)
            }
        }
        this.udcServerClient.write(this.pkt.construct(Packet.HEARTBEAT, ""));
    }

    async list_models(): Promise<Array<string>> {
        let default_devices = ['aiotkit',
            'developerkit',
            'esp32',
            'esp8266',
            'mk3060',
            'stm32l432kc',
            'tinylink_platform_1',
            'tinylink_lora',
            'tinylink_raspi'];

        let options = {
            host: '118.31.76.36',
            port: 8080,
            path: '/list/models',
            method: 'GET',
            cert: certificate,
            rejectUnauthorized: false
        }

        return new Promise((resolve, reject) => {
            https.request(options, function (res) {
                res.on('data', (d: Buffer) => {
                    let result = JSON.parse(d.toString('ascii'));
                    if (result.result === "success" && result.models != null) {
                        resolve(result.models)
                    } else {
                        resolve(default_devices)
                    }
                })

                res.on('error', (err) => {
                    console.log(err);
                    resolve(default_devices)
                })
            }).end();
        })
    }

    get is_connected(): Boolean {
        return (this.udcServerClient != null);
    }

    async connect(login_type: LOGINTYPE, model: string): Promise<Boolean | string> {
        let rets = await this.login_and_get_server(login_type, model);
        if (rets === []) { return false; }
        let [re, server_ip, server_port, token, certificate] = rets;
        if (re != 'success') { return false; }
        let result = await this.connect_to_server(server_ip, server_port, certificate);
        if (result !== 'success') return false;
        this.send_packet(Packet.packet_type.TERMINAL_LOGIN, `${this.login_type === LOGINTYPE.FIXED ? this.model : this.uuid},${token}`)
        return true;
    }

    async disconnect(): Promise<Boolean> {
        if (this.udcServerClient === null) {
            return true;
        }
        this.udcServerClient.destroy();
        this.udcServerClient = null;
        this.dev_list = undefined
        return true;
    }

    async erase_device(dev_str: string) {
        this.send_packet(Packet.DEVICE_ERASE, dev_str);
        await this.wait_cmd_excute_done(120000);
        return (this.cmd_excute_state === 'done' ? true : false);
    }

    async program_device(filepath: string, address: string, devstr: string): Promise<Boolean> {
        let send_result = await this.send_file_to_client(filepath, devstr);
        if (send_result === false) {
            return false;
        }

        let content = `${devstr},${address},${await this.pkt.hash_of_file(filepath)}`
        // console.log(content);
        this.send_packet(Packet.DEVICE_PROGRAM, content);
        await this.wait_cmd_excute_done(270000);
        return (this.cmd_excute_state === 'done' ? true : false);
    }

    async run_command(devstr: string, args: string) {
        let content = `${devstr}:${args.replace(' ', '|')}`
        this.send_packet(Packet.DEVICE_CMD, content);
        await this.wait_cmd_excute_done(1500);
        return (this.cmd_excute_state === 'done' ? true : false);
    }

    async control_device(devstr: string, operation: string): Promise<Boolean> {
        let operations: { [key: string]: string } = {
            'start': Packet.DEVICE_START,
            'stop': Packet.DEVICE_STOP,
            'reset': Packet.DEVICE_RESET,
        }
        if (operations.hasOwnProperty(operation) === false) {
            return false;
        }
        this.send_packet(operations[operation], devstr);
        await this.wait_cmd_excute_done(10000);
        return (this.cmd_excute_state === 'done' ? true : false);
    }

    async send_file_to_client(filepath: string, devstr: string): Promise<Boolean> {
        let filehash = await this.pkt.hash_of_file(filepath);
        let fullpath = filepath.split('/');
        let filename = fullpath[fullpath.length - 1]
        let content = devstr + ":" + filehash + ":" + filename;

        let retry = 4;
        while (retry > 0) {
            this.send_packet(Packet.FILE_BEGIN, content);
            await this.wait_cmd_excute_done(200);
            if (this.cmd_excute_state === "timeout") {
                retry--;
                continue;
            }
            if (this.cmd_excute_return === "busy") {
                console.log("send file server busy");
                await new Promise(res => setTimeout(res, 5000))
                continue;
            }
            if (this.cmd_excute_return === 'ok' || this.cmd_excute_return === 'exist') {
                break;
            }
        }

        if (retry === 0) {
            return false;
        }

        if (this.cmd_excute_return === "exist") {
            return true;
        }

        let fileBuffer = await fs.readFileSync(filepath)
        let seq = 0;
        while (seq * 8192 < fileBuffer.length) {
            let header = `${devstr}:${filehash}:${seq}:`;
            let end = (seq + 1) * 8192;
            if (end > fileBuffer.length) {
                end = fileBuffer.length;
            }
            retry = 4;
            while (retry > 0) {
                console.log("sending data");
                this.send_packet(Packet.FILE_DATA, header + fileBuffer.slice(seq * 8192, end).toString('ascii'));
                await this.wait_cmd_excute_done(200);
                if (this.cmd_excute_return === null) {
                    retry--;
                    continue;
                } else if (this.cmd_excute_return != 'ok') {
                    return false;
                }
                break;
            }
            if (retry === 0) {
                return false;
            }
            seq++;
        }

        //send file end
        content = `${devstr}:${filehash}:${filename}`;
        retry = 4;
        while (retry > 0) {
            this.send_packet(Packet.FILE_END, content);
            await this.wait_cmd_excute_done(200);
            if (this.cmd_excute_return === null) {
                retry--;
                continue;
            } else if (this.cmd_excute_return != 'ok') {
                return false;
            }
            break;
        }
        if (retry === 0) {
            return false
        }
        return true;
    }

    send_packet(type: string, content: string) {
        this.udcServerClient.write(this.pkt.construct(Packet.HEARTBEAT, ""));
        this.udcServerClient.write(this.pkt.construct(type, content));
    }

    async wait_cmd_excute_done(timeout: number) {
        this.cmd_excute_state = 'wait_response';
        this.cmd_excute_return = null;
        return new Promise((resolve, reject) => {
            let cmd_timeout = setTimeout(() => {
                this.cmd_excute_state = 'timeout';
                this.events.removeAllListeners('cmd-response');
                resolve();
            }, timeout);
            this.events.once('cmd-response', () => {
                clearTimeout(cmd_timeout);
                this.events.removeAllListeners('cmd-response');
                resolve();
            });
        });
    }

    get_devlist() {
        return this.dev_list;
    }

}