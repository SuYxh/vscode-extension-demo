import * as vscode from 'vscode';
import path from 'path';
import fs from 'fs';
import Communication from '../communication/index';

export interface MessageType {
  from: 'vscode' | 'other' | 'chat-gpt-web'
  msgId: string
  method: string
  data: any
}

type Callback = (params?: any) => void;
type CallbackWithReturnValue = (params?: any) => any;

interface CallbacksType {
  [key: string]: Callback | CallbackWithReturnValue;
}

class WebViewManager {
  private static instance: WebViewManager | null = null;
  private panel: vscode.WebviewPanel | undefined;
  private context: vscode.ExtensionContext | undefined;
  public projectPath: string | undefined
  public communication: Communication | null
  // 销毁已经创建的实例
  private _destroyInstance: Function

  private constructor(destroyInstance: Function) {
    this.communication = null
    this._destroyInstance = destroyInstance
  }

  /**
   * @description: 获取实例
   * @return {*}
   */
  public static getInstance(destroyInstance: Function): WebViewManager {
    if (!WebViewManager.instance) {
      WebViewManager.instance = new WebViewManager(destroyInstance);
    }
    return WebViewManager.instance;
  }

  /**
  * @description: 关闭 webview，然后清空实例
  * @return {*}
  */
  public destroyInstance() {
    // 将单例实例置为null
    WebViewManager.instance = null; 

    // 销毁通信的实例
    this.communication?.destroyInstance()
    this.communication = null

    // 销毁外部创建的实例，清空变量
    this._destroyInstance()

    // 关闭 webview 面板
    setTimeout(() => {
      this.panel?.dispose(); // 销毁Webview面板
    }, 1000);
  }

  /**
   * @description: 创建 webview
   * @param {vscode} context  vscode context
   * @param {string} webviewFilePath webview 页面对应的静态资源文件，最好放在根目录下的 dist 文件夹
   * @param {string} projectPath 打开 webview 时，资源管理器中 选中文件 对应的 路径，通过 vscode.commands.executeCommand 执行命令的时候获取不到该参数
   * @return {*}
   */
  public createWebView(context: vscode.ExtensionContext, webviewFilePath: string, projectPath?: string) {
    // 保存一下信息
    this.context = context
    this.projectPath = projectPath

    // 创建 webview
    this.panel = vscode.window.createWebviewPanel(
      'chat-gpt-webview-id', //  webview id
      'Chat GPT', // 标题
      vscode.ViewColumn.Two, //  webview 打开的位置
      {
        enableScripts: true, //  开启 js
        retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
      }
    );

    // 获取 webview 目录下dist文件夹的路径
    const distPathOnDisk = vscode.Uri.joinPath(context.extensionUri, webviewFilePath);

    // 获取dist文件夹的URI
    const distUri = this.panel.webview.asWebviewUri(distPathOnDisk);

    // 读取dist文件夹中index.html的内容
    const indexHtmlPath = path.join(distPathOnDisk.fsPath, 'index.html');
    const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');

    // 将资源路径替换为webview的
    let updatedHtmlContent = indexHtmlContent
      .replace(/src="([^"]*)"/g, (match, p1) => {
        return `src="${distUri}/${p1}"`;
      })
      .replace(/href="([^"]*)"/g, (match, p1) => {
        return `href="${distUri}/${p1}"`;
      })

    // 设置 html 内容
    this.panel.webview.html = updatedHtmlContent;

    // 监听发来的消息， MessageType 是约定好的
    // this.communication = Communication.getInstance(this.panel.webview)
    this.communication = new Communication(this.panel.webview)


    this.panel.onDidDispose(() => {
      // 在Webview面板关闭时执行的逻辑
      console.log('在Webview面板关闭时执行的逻辑');
      this.destroyInstance()
    }, undefined, context.subscriptions);

    /** 
    // webview 展现或者隐藏的时候触发 
    this.panel.onDidChangeViewState((event) => {
      console.log('handleSendMsg--onDidChangeViewState', event);

      if (event.webviewPanel.active) {
        // Webview面板激活（包括每次页面加载完成）时的处理逻辑
        console.log('panel 加载完成 准备发送消息');
      }
    }, undefined, context.subscriptions);
    */
  }

  /**
   * @description: 获取 panel
   * @return {*}
   */
  public getPanel(): vscode.WebviewPanel | undefined {
    return this.panel;
  }
}

export default WebViewManager