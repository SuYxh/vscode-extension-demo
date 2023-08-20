import * as vscode from 'vscode';
import { alert, genRes, getMsgId, showError } from '../util';
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

class Communication {
  private static instance: Communication | null = null;
  private messageHandler: CallbacksType
  private fnQueue: FunctionQueue
  public webview: vscode.Webview

  public constructor(webview: vscode.Webview) {
    this.webview = webview
    this.messageHandler = this.getMessageHandler()
    // 缓存函数的队列
    this.fnQueue = new FunctionQueue()

    this.startListen()
  }

  /**
   * @description: 获取实例
   * @return {*}
   */
  public static getInstance(webview: vscode.Webview): Communication {
    if (!Communication.instance) {
      Communication.instance = new Communication(webview);
    }
    return Communication.instance;
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
        const res = '模拟获取工程路径 /User/Jarvis/xxx'
        _this.sendMsgToWebview(message.msgId, genRes(res))
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
   * @description: 向 webview 发送消息
   * @param {string} method webview页面里面的方法名称，即需要调用 webview 页面里的哪个方法
   * @param {any} data 调用 webview 页面方法时传入的参数
   * @return {*}
   */
  public sendMsgToWebview(method: string, data?: any) {
    if (this.webview) {
      const msg: MessageType = {
        from: 'vscode',
        msgId: getMsgId(),
        method,
        data
      }
      this.webview.postMessage(msg);
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
   * @description: 开启监听
   * @return {*}
   */  
  public startListen() {
    this.webview.onDidReceiveMessage((message: MessageType) => {
      console.log('收到来自 webview 的消息', message);

      // 找到需要调用的函数
      const fn = this.messageHandler[message.method]

      // 函数存在就调用
      if (fn && typeof fn === 'function') {
        fn(message)
      } else {
        showError(`该端未实现 ${message.method} 方法！`);
      }

    });
  }

   /**
  * @description: 关闭 webview，然后清空实例
  * @return {*}
  */
   public destroyInstance() {
    // 清空队列
    this.fnQueue.clear()
    // 销毁实例
    Communication.instance = null; // 将单例实例置为null
  }
}

export default Communication