import * as vscode from 'vscode';
import path from 'path';
import fs from 'fs';
import { showError, getProjectName, alert } from './util';
import FunctionQueue from './FunctionQueue';

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
  private messageHandler: CallbacksType
  private projectPath: string | undefined
  private fnQueue: FunctionQueue

  private constructor() {
    this.messageHandler = this.getMessageHandler()
    // 缓存函数的队列
    this.fnQueue = new FunctionQueue()
  }

  /**
   * @description: 获取实例
   * @return {*}
   */  
  public static getInstance(): WebViewManager {
    if (!WebViewManager.instance) {
      WebViewManager.instance = new WebViewManager();
    }
    return WebViewManager.instance;
  }

  /**
   * @description: 处理回调函数的统一返回结果
   * @param {any} resp
   * @param {number} code
   * @param {string} msg
   * @return {*}
   */  
  public genRes(resp: any, code?: number, msg?: string) {
    code = code ? code : 200
    msg = msg ? msg : ''
    return {
      code,
      msg,
      data: resp
    }
  }

  /**
   * @description: 事件集合
   * @return {*}
   */  
  public getMessageHandler() {
    const _this = this
    return {
      // webview 页面加载完毕后，会触发该事件
      mounted() {
        console.log('webview 页面加载完毕');
        // 如果有缓存的事件，就依次按照顺序执行，执行结束后清空队列
        _this.fnQueue.execute().then(() => {
          console.log('所有函数执行完毕，清空队列');
          _this.fnQueue.clear()
        }).catch(err => {
          console.log('execute 执行出错', err);
        })
      },
      // 获取工程名
      getProjectName(message: MessageType) {
        const res = getProjectName(_this.projectPath)
        _this.sendMsgToWebview(message.msgId, _this.genRes(res))
      },
      // 弹窗
      showInfo(msg: MessageType) {
        console.log('showInfo', msg);
        alert(msg.data)
      },
      showError(msg: MessageType) {
        alert(msg.data, 'error')
      }
    }
  }

  /**
   * @description: 生成 消息 id
   * @return {*}
   */  
  public getMsgId() {
    return Date.now() + '' + Math.round(Math.random() * 100000);
  }

  /**
   * @description: 向 webview 发送消息
   * @param {string} method webview页面里面的方法名称，即需要调用 webview 页面里的哪个方法
   * @param {any} data 调用 webview 页面方法时传入的参数
   * @return {*}
   */
  public sendMsgToWebview(method: string, data?: any) {
    if (this.panel) {
      const msg: MessageType = {
        from: 'vscode',
        msgId: this.getMsgId(),
        method,
        data
      }
      this.panel.webview.postMessage(msg);
    } else {
      console.log('webview 不存在');
    }
  }

  /**
   * @description: 缓存函数
   * @param {any} fn 函数
   * @param {array} args 函数对应的参数
   * @return {*}
   */
  public cacheFunc(fn: any, ...args: any[]) {
    this.fnQueue.enqueue(fn, ...args)
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
    // context.subscriptions： 在插件被禁用或者卸载的时候取消监听，防止内存泄漏
    this.panel.webview.onDidReceiveMessage((message: MessageType) => {
      console.log('收到来自 webview 的消息', message);

      // 找到需要调用的函数
      const fn = this.messageHandler[message.method]

      // 函数存在就调用
      if (fn && typeof fn === 'function') {
        fn(message)
      } else {
        showError(`该端未实现 ${message.method} 方法！`);
      }

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