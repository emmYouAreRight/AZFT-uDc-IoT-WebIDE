import { UdcClient } from './../common/udc-watcher';
import { injectable, inject } from "inversify";
import * as tls from 'tls';
import * as fs from 'fs-extra';
import { Packet } from "./packet";
import * as events from "events";


import { networkInterfaces } from 'os';

@injectable()
export class UdcTerminal {
    udcserver: any;
    DEFAULT_SERVER: string = "118.31.76.36";
    DEFAULT_PORT: number = 2000;
    catification = "-----BEGIN CERTIFICATE-----\
    MIIDqzCCApOgAwIBAgIJAOTVKkX6qd8LMA0GCSqGSIb3DQEBCwUAMGwxCzAJBgNV\
    BAYTAkNOMREwDwYDVQQIDAhaaGVqaWFuZzERMA8GA1UEBwwISGFuZ3pob3UxFjAU\
    BgNVBAoMDUFsaWJhYmEgQ2xvdWQxDDAKBgNVBAsMA0lvVDERMA8GA1UEAwwIdWRj\
    ZW50ZXIwHhcNMTgwMTIzMDgwMDE3WhcNMTkwMTIzMDgwMDE3WjBsMQswCQYDVQQG\
    EwJDTjERMA8GA1UECAwIWmhlamlhbmcxETAPBgNVBAcMCEhhbmd6aG91MRYwFAYD\
    VQQKDA1BbGliYWJhIENsb3VkMQwwCgYDVQQLDANJb1QxETAPBgNVBAMMCHVkY2Vu\
    dGVyMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAx6r8YZJkAWFK2oj6\
    wQVR/tf3+CXLWTnzNQrV/kJLPo1HmvxE5HmVyToQFVv2RxBFF4fUZO1RZwEgiSnV\
    ZEbkuOHkZQ+3hG81VSsARhm8EwUIRgcSzEPLFJjozESHdyk80t1Stzs84WhK4x+x\
    Sdpm5GrlUShZ7zxiK41nM+21hQr0cRAY/zh6DeYIfcZzAlHPwuE9GTudNIVkP437\
    kcQsvY3ihJB1EKI6fQYwdEOlMIDcEhHbgIPMTup88G6J+5/Ma7ueA+HlBpBRN/aN\
    rQW8dsEfi8FTsyI9xqCPQctPPFVOy4s/wTdXieK1fdyfaA+7qzfOVAPpoAACcRlv\
    2frKaQIDAQABo1AwTjAdBgNVHQ4EFgQU12lL8lUzpmGCGDbEYfWJd1U0T7gwHwYD\
    VR0jBBgwFoAU12lL8lUzpmGCGDbEYfWJd1U0T7gwDAYDVR0TBAUwAwEB/zANBgkq\
    hkiG9w0BAQsFAAOCAQEAcz1zZFBSAfz60g7aQdxNIb+y2jWV0gC04K1gLbeOLv0G\
    1uNby28a35CJESEPprA7B5JNgzNBvA0tBdwGlTcsDtAzQOdjdnhsK/Oqr78sYBf8\
    ncRIiE+Bs1/LnPBsjksWuM8QGGM+YUVOHaAxNMc7sE5cYCZY/SjWScerAjANVA9E\
    IsSdEkoF7+QL4nk0QZF4Y8p1iLCBo7i9xLS0qFr9rEmUblhgA0NEFRn9O+ijxVrD\
    QIS3CmcdAzFtnS9SNzuvFhRJTyfQZTwmbD598g7ZsPCJ111L/X+Pj5AAmr8F/AeN\
    w1HmLfnaQnRiOP2O/pul+QL1GnctQFE2Bslz9Dd+mw==\
    -----END CERTIFICATE-----\
    "
    udcControlerClient: any
    model : string = "tinylink_lora"
    dev_list: { [key: string]: number } = {}
    cmd_excute_state = "idle"
    cmd_excute_return: any = ""
    
    udcServerClient: any

    udcClient:UdcClient|undefined =undefined

    event: any
    constructor(
        @inject(Packet) protected readonly pkt: Packet,
    ) {
        this.event = new events.EventEmitter();
    }

    setClient(client:UdcClient){
        this.udcClient=client;
    }

    get uuid(): string {
        let uuid : string = '';
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

    login_and_get_server(): Promise<Array<any>> {
        let options = {
            ca: this.catification,
            rejectUnauthorized: false,
            requestCert: false
        }

        this.udcControlerClient = tls.connect(this.DEFAULT_PORT, this.DEFAULT_SERVER, options, () => {
            console.log('connected to controller');
            let send = this.pkt.construct(Packet.ACCESS_LOGIN,
                ['terminal', this.uuid, 'adhoc', this.model].join());
            this.udcControlerClient.write(send)
        });
        this.udcControlerClient.on('close', () => {
            console.log('uDC controller connection closed!')
        })
        this.udcControlerClient.on('error', (err: any) => {
            console.log(err);
        })

        let _this = this;
        return new Promise(function (resolve, reject) {
            _this.udcControlerClient.on('data', (data: any) => {
                //连接到controller ，获得ca
                let [type, length, value, msg] = _this.pkt.parse(data.toString('ascii'));
                let rets = value.split(',');
                if (type != Packet.ACCESS_LOGIN || rets[0] != 'success') {
                    console.log('Recevied: ', type, length, value, msg);
                    reject(data.toString('ascii'));
                } else {
                    resolve(rets);
                }
            })
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

        } else if (type === Packet.DEVICE_STATUS) {

        } else if (type === Packet.TERMINAL_LOGIN) {
            if (value === 'success') {
                console.log('server login success');
            } else {
                console.log('login failed retrying ...');
                this.connect()
            }
        } else if (type === Packet.CMD_DONE) {
            console.log("done");
            this.cmd_excute_return = value;
            this.cmd_excute_state = "done";

        } else if (type === Packet.CMD_ERROR) {
            console.log('error' + data.toString('ascii'));
            this.cmd_excute_state = "error";
            this.cmd_excute_return = value;
        } else if (type == Packet.DEVICE_LOG) {
           if(this.udcClient){
               this.udcClient.OnDeviceLog(data.toString("ascii"))
           }
        }
    }

    erase_device(dev_str: string) {
        this.send_packet(Packet.DEVICE_ERASE, dev_str)
    }

    async program_devices(filepath: string, devstr: string): Promise<Boolean> {
        let send_result = await this.send_file_to_client(filepath, devstr);
        if (send_result === false) {
            return false;
        }

        let content = `${devstr},0x40000,${await this.pkt.hash_of_file(filepath)}`
        console.log(content);
        this.send_packet(Packet.DEVICE_PROGRAM, content);
        await this.wait_cmd_excute_done(2700);
        if (this.cmd_excute_state === 'done') {
            return true;
        } else {
            return false;
        }
    }

    async connect(): Promise<Boolean> {
        try {
            let rets = await this.login_and_get_server();
            if (rets === []) { return false; }
            let [re, server_ip, server_port, token, certifacate] = rets;
            if (re != 'success') { return false; }
            let result = await this.connect_to_server(server_ip, server_port, certifacate);
            if (result !== 'success') return false;
            this.send_packet(Packet.packet_type.TERMINAL_LOGIN, `${this.uuid},${token}`)
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
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

    send_packet(type: string, content: string){
        this.udcServerClient.write(this.pkt.construct(type, content))
    }

    async wait_cmd_excute_done(time: number) {
        this.cmd_excute_state = 'wait_response';
        this.cmd_excute_return = null;
        return new Promise(res => setTimeout(res, time));
    }

    get_devstr_by_index() {

    }

    get_devlist() {
        return this.dev_list;
    }

}