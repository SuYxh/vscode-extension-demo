import * as vscode from 'vscode';
import { getAsWebviewUri, showError, alert } from './util';
import path from 'path';
import fs from 'fs';
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

export class SideBarViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'chat-gpt-view-id';
  private static instance: SideBarViewProvider | null = null;
	private context: vscode.ExtensionContext
	public _view?: vscode.WebviewView;
  private messageHandler: CallbacksType
  private fnQueue: FunctionQueue

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _context: vscode.ExtensionContext,
	) {
		console.log('SideBarViewProvider');
		this.context = _context
		this.messageHandler = this.getMessageHandler()
    // 缓存函数的队列
    this.fnQueue = new FunctionQueue()
	}

  /**
   * @description: 获取实例
   * @param {vscode} context
   * @return {*}
   */	 
	 public static getInstance(context: vscode.ExtensionContext): SideBarViewProvider {
		if (!SideBarViewProvider.instance) {
      SideBarViewProvider.instance = new SideBarViewProvider(context.extensionUri, context);
    }
    return SideBarViewProvider.instance;
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
    if (this._view) {
      const msg: MessageType = {
        from: 'vscode',
        msgId: this.getMsgId(),
        method,
        data
      }
      this._view.webview.postMessage(msg);
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

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {

		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'dist')]
		};

		// 获取 webview 目录下dist文件夹的路径
    const distPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'dist');

    // 读取dist文件夹中index.html的内容
		const distUri = getAsWebviewUri(webviewView.webview, this._extensionUri, ["dist"]);

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

		webviewView.webview.html = updatedHtmlContent

		this.addReceiveMessageEvents(webviewView.webview);
	}

	/**
	 * Add listener for event comes from js.
	 * @param webview :vscode.Webview
	 */
	private addReceiveMessageEvents(webview: vscode.Webview) {
		webview.onDidReceiveMessage((message: MessageType) => {
			console.log('onDidReceiveMessage', message);

			console.log('收到来自 webview 的消息', message);

      // 找到需要调用的函数
      const fn = this.messageHandler[message.method]

      // 函数存在就调用
      if (fn && typeof fn === 'function') {
        fn(message)
      } else {
        showError(`该端未实现 ${message.method} 方法！`);
      }
		},
			undefined,
			this.context.subscriptions
		);
	}

	/**
   * @description: 获取 WebviewView
   * @return {*}
   */
  public getWebview(): vscode.WebviewView | undefined {
    return this._view;
  }
}