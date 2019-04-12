/**
 * Generated using theia-plugin-generator
 */

import * as theia from "@theia/plugin";

namespace IoTCommands {
    const IOT_CATEGORY = "IoT Plugin";

    export const TINYLINK_COMPILE = {
        id: "iot.plugin.tinylink.compile",
        category: IOT_CATEGORY,
        label: "TinyLink Compile"
    };

    export const TINYSIM_COMPILE = {
        id: "iot.plugin.tinysim.compile",
        category: IOT_CATEGORY,
        label: "TinySim Compile"
    };

    export const ONELINK_COMPILE = {
        id: "iot.plugin.onelink.compile",
        category: IOT_CATEGORY,
        label: "OneLink Compile"
    };
}

namespace IoTURL {
    export const TINYLINK_LOCAL =
        "http://tinylink.daixinye.com/webview/tinylink/localcompile";
    export const TINYSIM =
        "http://tinylink.daixinye.com/webview/tinysim"
    export const ONELINK = 
        "http://tinylink.daixinye.com/webview/onelink"

    export function getQueryParameterString() {
        const parameters = theia.env.getQueryParameters() || {};
        const parametersList = [];
        for (let key in parameters) {
            parametersList.push(`${key}=${parameters[key]}`);
        }
        return parametersList.join("&");
    }
}

namespace IoTWebview {
    export function generateHTML(url: string) {
        return `
                        <script>
                            window.addEventListener("message",function(e){
                                var data = e.data.data
                                var from = e.data.from
                                switch(from){
                                    case 'webide':
                                        document.getElementById('iframe').contentWindow.postMessage({
                                            from: 'webview',
                                            data: data
                                        },'*')
                                        break
                                    case 'iframe':
                                        window.postMessageExt(data)
                                        break
                                }
                            },false)
                        </script>
                        <iframe id="iframe" src="${url}" frameborder="0" style="display: block; margin: 0px; overflow: hidden; position: absolute; width: 100%; height: 100%; visibility: visible;" sandbox="allow-same-origin allow-scripts allow-forms"></iframe>
                        `;
    }

    export function onDidReceiveMessage(panel: theia.WebviewPanel) {
        return function(data: any) {
            if (data && data.type === "command") {
                switch (data.content) {
                    case "open_file_picker":
                        theia.window
                            .showOpenDialog({
                                defaultUri: theia.Uri.parse("/home/project")
                            })
                            .then((val: any) => {
                                if (!val || !val.length) {
                                    return theia.window.showErrorMessage("没有选择文件");
                                }
                                panel.webview.postMessage({
                                    from: "webide",
                                    data: {
                                        path: val[0].path
                                    }
                                });
                            });
                        break;
                    default:
                }
            }
        }

    }
}

export function start(context: theia.PluginContext) {
    context.subscriptions.push(
        theia.commands.registerCommand(
            IoTCommands.TINYLINK_COMPILE,
            async (...args: any[]) => {
                const panel = theia.window.createWebviewPanel(
                    "TinyLink",
                    "TinyLink",
                    theia.ViewColumn.Active
                );
                panel.webview.html = IoTWebview.generateHTML(
                    IoTURL.TINYLINK_LOCAL + "?" + IoTURL.getQueryParameterString()
                );
                panel.webview.onDidReceiveMessage(IoTWebview.onDidReceiveMessage(panel));
            }
        )
    );

    context.subscriptions.push(
        theia.commands.registerCommand(
            IoTCommands.TINYSIM_COMPILE,
            async (...args: any[]) => {
                const panel = theia.window.createWebviewPanel(
                    "TinySim",
                    "TinySim",
                    theia.ViewColumn.Active
                );
                panel.webview.html = IoTWebview.generateHTML(
                    IoTURL.TINYSIM + "?" + IoTURL.getQueryParameterString()
                );
                panel.webview.onDidReceiveMessage(IoTWebview.onDidReceiveMessage(panel));
            }
        )
    );

    context.subscriptions.push(
        theia.commands.registerCommand(
            IoTCommands.ONELINK_COMPILE,
            async (...args: any[]) => {
                const panel = theia.window.createWebviewPanel(
                    "OneLink",
                    "OneLink",
                    theia.ViewColumn.Active
                );
                panel.webview.html = IoTWebview.generateHTML(
                    IoTURL.ONELINK + "?" + IoTURL.getQueryParameterString()
                );
                panel.webview.onDidReceiveMessage(IoTWebview.onDidReceiveMessage(panel));
            }
        )
    );
}

export function stop() { }
