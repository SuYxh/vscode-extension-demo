import * as vscode from 'vscode';
import registerGPTCommand from './registerGPTCommand';
import sideBarViewPanelCommand from './sideBarViewPanelCommand';

function registerPanelCommand(context: vscode.ExtensionContext) {
  // 普通的 webview 视图
  // registerGPTCommand(context)

  // 侧边栏打开 webview 
  sideBarViewPanelCommand(context)
}

export default registerPanelCommand