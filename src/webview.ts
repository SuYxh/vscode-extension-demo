import * as vscode from 'vscode';
import path from 'path';
import fs from 'fs';
import { showError, getProjectPath, getProjectName, } from './util';
import { MessageType } from './type';


/**
 * 执行回调函数
 * @param {*} panel 
 * @param {*} message 
 * @param {*} resp 
 */
function invokeCallback(panel: any, message: MessageType, resp: any) {
    console.log('invokeCallback--回调消息--message：', message);
    console.log('invokeCallback--回调消息--resp', resp);
    // 错误码在400-600之间的，默认弹出错误提示
    if (typeof resp == 'object' && resp.code && resp.code >= 400 && resp.code < 600) {
        showError(resp.message || '发生未知错误！');
    }

    const msg: MessageType = {
        from: 'vscode',
        msgId: message.msgId,
        method: 'vscodeCallback',
        data: {
            code: 200,
            msg: '',
            data: resp
        }
    }
    panel.webview.postMessage(msg);
}

/**
 * 存放所有消息回调函数，根据 message. msgId 来决定调用哪个方法
 */
const messageHandler: any = {
    // 获取工程名
    getProjectName(global: any, message: MessageType) {
        const res = getProjectName(global.projectPath)
        invokeCallback(global.panel, message, res);
    },
};


/**
 * @description: 向 webview 发送消息
 * @param {*} panel
 * @return {*}
 */
function sendMsgToWebview(panel: any) {
    setTimeout(() => {
        const msgId = Date.now() + '' + Math.round(Math.random() * 100000);

        const msg: MessageType = {
            from: 'vscode',
            msgId,
            method: 'test',
            data: {
                text: 'hello'
            }
        }
        panel.webview.postMessage(msg);
    }, 1000);
}

/**
 * @description: 创建 webview
 * @param {vscode} context
 * @param {string} webviewFilePath
 * @param {any} projectPath
 * @return {*}
 */
function createWebview(context: vscode.ExtensionContext, webviewFilePath: string, projectPath?: any) {

    const panel = vscode.window.createWebviewPanel(
        'webViewExample', // Identifies the type of the webview. Used internally
        'Web View Example', // Title of the panel displayed to the user
        vscode.ViewColumn.One, // Editor column to show the webview panel in
        {
            enableScripts: true // Enable JavaScript in the webview
        }
    );

    // Get the path to the dist folder in your webview directory
    const distPathOnDisk = vscode.Uri.joinPath(context.extensionUri, webviewFilePath);

    // Get the URI to dist folder
    const distUri = panel.webview.asWebviewUri(distPathOnDisk);

    // Read the content of index.html from dist folder
    const indexHtmlPath = path.join(distPathOnDisk.fsPath, 'index.html');
    const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');

    // Replace resource paths with the webview URI
    let updatedHtmlContent = indexHtmlContent
        .replace(/src="([^"]*)"/g, (match, p1) => {
            return `src="${distUri}/${p1}"`;
        })
        .replace(/href="([^"]*)"/g, (match, p1) => {
            return `href="${distUri}/${p1}"`;
        })

    panel.webview.html = updatedHtmlContent;

    let global = { projectPath, panel };
    panel.webview.onDidReceiveMessage((message: MessageType) => {
        console.log('收到来自 webview 的消息', message);
        if (messageHandler[message.method]) {
            messageHandler[message.method](global, message);
        } else {
            showError(`未找到名为 ${message.method} 回调方法!`);
        }
    }, undefined, context.subscriptions);

    sendMsgToWebview(panel)
}

/**
 * @description: 注册命令，打开 webview
 * @param {vscode} context
 * @return {*}
 */
export default function registerWebviewCommand(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('extension.openWebview', function (uri) {
        // 工程目录一定要提前获取，因为创建了webview之后 activeTextEditor 会不准确
        const projectPath = getProjectPath(uri);
        console.log('打开 webview 时候对应的文件路径', projectPath);
        createWebview(context, 'dist', projectPath)
    }));
}