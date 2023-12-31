import * as vscode from 'vscode';
import { Uri, Webview } from "vscode";
import fs from 'fs';
import path from 'path';

// export function getAsWebviewUri(webview: Webview, extensionUri: Uri, pathList: string[]) {
//     return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
// }
export function genRes(resp: any, code?: number, msg?: string) {
    code = code ? code : 200
    msg = msg ? msg : ''
    return {
        code,
        msg,
        data: resp
    }
}

/**
  * @description: 生成 消息 id
  * @return {*}
  */
export function getMsgId() {
    return Date.now() + '' + Math.round(Math.random() * 100000);
}

/**
 * 弹出提示信息
 */
export function alert(info: string, type?: 'info' | 'error') {
    type = type ? type : 'info'
    switch (type) {
        case 'info':
            vscode.window.showInformationMessage(info);
            break;
        case 'error':
            vscode.window.showErrorMessage(info);
            break;
        default:
            break;
    }
}

export function showError(info: string) {
    vscode.window.showErrorMessage(info);
}

export function getExtensionFileAbsolutePath(context: vscode.ExtensionContext, relativePath: string) {
    return path.join(context.extensionPath, relativePath);
}

export function getAsWebviewUri(webview: Webview, extensionUri: Uri, pathList: string[]) {
    return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
}


export function getProjectName(projectPath: string | undefined) {
    if (!projectPath) {
        return ''
    }
    return path.basename(projectPath);
}

export function getProjectPath(document: any) {
    if (!document) {
        document = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.document : null;
    }
    if (!document) {
        showError('当前激活的编辑器不是文件或者没有文件被打开！');
        return '';
    }
    const currentFile = (document.uri ? document.uri : document).fsPath;

    if (!currentFile) {
        return
    }

    let projectPath = null;

    // @ts-ignore
    let workspaceFolders = vscode.workspace.workspaceFolders.map(item => item.uri.path);
    // 由于存在Multi-root工作区，暂时没有特别好的判断方法，先这样粗暴判断
    // 如果发现只有一个根文件夹，读取其子文件夹作为 workspaceFolders
    if (workspaceFolders.length == 1 && workspaceFolders[0] === vscode.workspace.rootPath) {
        const rootPath = workspaceFolders[0];
        var files = fs.readdirSync(rootPath);
        workspaceFolders = files.filter((name: string) => !/^\./g.test(name)).map(name => path.resolve(rootPath, name));
        // vscode.workspace.rootPath会不准确，且已过时
        // return vscode.workspace.rootPath + '/' + this._getProjectName(vscode, document);
    }
    workspaceFolders.forEach(folder => {
        if (currentFile?.indexOf(folder) === 0) {
            projectPath = folder;
        }
    })
    if (!projectPath) {
        showError('获取工程根路径异常！');
        return '';
    }
    return projectPath;
}