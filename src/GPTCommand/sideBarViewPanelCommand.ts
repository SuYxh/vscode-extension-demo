import * as vscode from 'vscode';
import { SideBarViewProvider } from '../webview/sideBarViewPanel';
import { alert } from '../util';
import registerGPTCommand from './commands';

export default function sideBarViewPanelCommand(context: vscode.ExtensionContext) {
  // 获取实例
  const provider = SideBarViewProvider.getInstance(context)

  context.subscriptions.push(vscode.window.registerWebviewViewProvider(SideBarViewProvider.viewType, provider));

  function handlePreSendMsg(method: string, data: any) {
    // 此时只是打开了 webview，页面不一定加载完毕，先把函数缓存起来，等到 页面 加载完毕后 再进行执行，页面加载完毕后，会向 vscode 插件发送 mounted 消息， 此时会去执行缓存的所有方法，清空队列
    // 需要改变一下 this 指向，否则缓存的函数在执行的时候会无法获取到 panel 而报错
    // method, data 是传递给 instance.sendMsgToWebview 方法的参数



    if (provider.communication) {
      provider.communication.cacheFunc(provider.communication.sendMsgToWebview.bind(provider.communication), method, data)
    }
  }


  function handleOpenWebview(method: string, data: string) {
    console.log('handleOpenWebview 执行 -- visible', provider._view?.visible);

    // provider._view?.visible 表示当前侧边栏的 webview 是否可见
    // 如果 webview 可见，直接发消息，否则缓存函数，等待 webview 加载完毕后再发消息
    if (provider._view?.visible) {
      provider.communication && provider.communication.sendMsgToWebview(method, data)
    } else {
      const result = vscode.commands.executeCommand('workbench.view.extension.chat-gpt-view');
      result.then((value) => {
        // 命令执行成功时的处理逻辑
        console.log('workbench.view.extension.chat-gpt-view', value);
        // webview 打开后，准备发送消息
        // 这里为什么不使用 instance.sendMsgToWebview 直接发送消息 ？ 
        // 此时只是打开了 webview，页面不一定加载完毕，此时发送消息，页面上不一定能接收到。所以需要预处理一下，将发送的动作(即 函数)缓存起来，等到页面加载完成的通知，然后在进行消息发送
        handlePreSendMsg(method, data)
      }, (error) => {
        // 命令执行失败时的处理逻辑
        console.log('workbench.view.extension.chat-gpt-view faile', error);
      });
    }
  }

  // 注册 openWebview 命令
  const openWebviewDisposable = vscode.commands.registerCommand('extension.openWebview', function (uri) {
    console.log('extension.openWebview-uri', uri);

    if (provider._view?.visible) {
      alert('GPT 已经启动啦')
      return
    }

    const result = vscode.commands.executeCommand('workbench.view.extension.chat-gpt-view');
    result.then((value) => {
      // 命令执行成功时的处理逻辑
      console.log('workbench.view.extension.chat-gpt-view', value);
    }, (error) => {
      // 命令执行失败时的处理逻辑
      console.log('workbench.view.extension.chat-gpt-view faile', error);
    });
  })

  context.subscriptions.push(openWebviewDisposable);

  registerGPTCommand(context, handleOpenWebview)
} 