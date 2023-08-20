import * as vscode from 'vscode';
import commonViewPanelCommand from './commonViewPanelCommand';
import sideBarViewPanelCommand from './sideBarViewPanelCommand';
import { showWebViewInSidebar } from '../handleVscodeConfig/vsodeConfig';
import { SideBarViewProvider } from '../webview/sideBarViewPanel';

function registerPanelCommand(context: vscode.ExtensionContext) {
  console.log('showWebViewInSidebar', showWebViewInSidebar());

  if (showWebViewInSidebar()) {
    sideBarViewPanelCommand(context)
  } else {
    // 获取实例
    const provider = SideBarViewProvider.getInstance(context)
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(SideBarViewProvider.viewType, provider));

    commonViewPanelCommand(context)
  }
}

export default registerPanelCommand