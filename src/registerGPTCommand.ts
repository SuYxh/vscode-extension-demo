import * as vscode from 'vscode';
import WebViewManager from './WebViewManager';
import { getProjectPath } from './util';


export default function registerGPTCommand(context: vscode.ExtensionContext) {
  // 获取实例
  let instance = WebViewManager.getInstance(destroyInstance)

  function destroyInstance() {
    // @ts-ignore
    instance = null
  }

  /**
   * @description: 预处理需要发送的请求
   * @param {string} method webview页面里面的方法名称，即需要调用 webview 页面里的哪个方法
   * @param {any} data 调用 webview 页面方法时传入的参数
   * @return {*}
   */
  function handlePreSendMsg(method: string, data: any) {
    // 此时只是打开了 webview，页面不一定加载完毕，先把函数缓存起来，等到 页面 加载完毕后 再进行执行，页面加载完毕后，会向 vscode 插件发送 mounted 消息， 此时会去执行缓存的所有方法，清空队列
    // 需要改变一下 this 指向，否则缓存的函数在执行的时候会无法获取到 panel 而报错
    // method, data 是传递给 instance.sendMsgToWebview 方法的参数
    instance.cacheFunc(instance.sendMsgToWebview.bind(instance), method, data)
  }

  /**
   * @description: 打开 webview 发送消息
   * @param {string} method  webview页面里面的方法名称，即需要调用 webview 页面里的哪个方法
   * @param {string} data 调用 webview 页面方法时传入的参数
   * @return {*}
   */
  function handleOpenWebview(method: string, data: string) {
    // 判断一下是否已经打开了 webview，如果是直接发送消息即可
    if (instance && instance.getPanel()) {
      // test 是方法名称，约定好的
      instance.sendMsgToWebview(method, data)
    } else {
      // webview 没有打开的时，执行 extension.openWebview 命令 打开 webview
      const result = vscode.commands.executeCommand('extension.openWebview')
      result.then((value) => {
        // 命令执行成功时的处理逻辑
        console.log('extension.openWebview success', value);
        // webview 打开后，准备发送消息
        // 这里为什么不使用 instance.sendMsgToWebview 直接发送消息 ？ 
        // 此时只是打开了 webview，页面不一定加载完毕，此时发送消息，页面上不一定能接收到。所以需要预处理一下，将发送的动作(即 函数)缓存起来，等到页面加载完成的通知，然后在进行消息发送
        handlePreSendMsg(method, data)
      }, (error) => {
        // 命令执行失败时的处理逻辑
        console.log('extension.openWebview faile', error);
      });
    }
  }

  // 注册 openWebview 命令
  const openWebviewDisposable = vscode.commands.registerCommand('extension.openWebview', function (uri) {
    console.log('extension.openWebview-uri', uri);

    // 退出登录后, 再次选择菜单 解释这段代码 时，instance 被清理掉，需要打开  新的webview， 此时还需要在重新生成一下实例
    if (!instance) {
      instance = WebViewManager.getInstance(destroyInstance)
    }

    if (uri && uri.path) {
      // 工程目录一定要提前获取，因为创建了webview之后 activeTextEditor 会不准确
      const projectPath = getProjectPath(uri);
      console.log('打开 webview 时候对应的文件路径', projectPath);

      instance.createWebView(context, 'dist', projectPath)
    } else {
      instance.createWebView(context, 'dist')
    }
  })

  context.subscriptions.push(openWebviewDisposable);


  // 注册 优化代码 命令
  let optimizeCodeDisposable = vscode.commands.registerCommand('myExtension.optimizeCode', () => {
    const activeTextEditor = vscode.window.activeTextEditor;
    if (activeTextEditor) {
      const selectedText = activeTextEditor.document.getText(activeTextEditor.selection);
      console.log('当前选中的代码', selectedText);
      const data = `请优化这段代码： ${selectedText}`
      handleOpenWebview('test', data)
    }
  });

  context.subscriptions.push(optimizeCodeDisposable);

  // 注册 解释代码 命令
  let explainCodeDisposable = vscode.commands.registerCommand('myExtension.explainCode', () => {
    const activeTextEditor = vscode.window.activeTextEditor;
    if (activeTextEditor) {
      const selectedText = activeTextEditor.document.getText(activeTextEditor.selection);
      console.log('当前选中的代码', selectedText);
      const data = `请详细解释一下这段代码： ${selectedText}`
      handleOpenWebview('test', data)
    }
  });

  context.subscriptions.push(explainCodeDisposable);

  // 注册 说明这段代码可能存在的问题 命令
  let questionCodeDisposable = vscode.commands.registerCommand('myExtension.questionCode', () => {
    const activeTextEditor = vscode.window.activeTextEditor;
    if (activeTextEditor) {
      const selectedText = activeTextEditor.document.getText(activeTextEditor.selection);
      console.log('当前选中的代码', selectedText);
      const data = `说明这段代码可能存在的问题： ${selectedText}`
      handleOpenWebview('test', data)
    }
  });

  context.subscriptions.push(questionCodeDisposable);
} 