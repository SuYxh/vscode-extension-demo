import * as vscode from 'vscode';

/**
 * @description: 弹窗
 * @return {*}
 */
function promptForReload() {
  vscode.window.showInformationMessage('配置发生改变，是否立即重启？', '重新启动').then(choice => {
    if (choice === '重新启动') {
      vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
  });
}


/**
 * @description: 监听 extension.showWebViewInSidebar 配置的变化， 是否在侧边栏打开 webview
 * @param {vscode} e
 * @return {*}
 */
function handleShowWebViewInSidebar(e: vscode.ConfigurationChangeEvent) {
  if (e.affectsConfiguration('extension.showWebViewInSidebar')) {
    const isEnabled = vscode.workspace.getConfiguration('extension').get('showWebViewInSidebar', true);
    if (isEnabled) {
      vscode.window.showInformationMessage('配置改变，需要重启后生效！');
      promptForReload();
    } else {
      vscode.window.showInformationMessage('配置改变，需要重启后生效！');
      promptForReload();
    }
  }
}

/**
 * @description: 监听配置文件的变化
 * @param {vscode} context
 * @return {*}
 */
function onDidChangeConfiguration(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      // 监听 是否在侧边栏打开 webview 配置的变化
      handleShowWebViewInSidebar(e)
    })
  );
}

export default onDidChangeConfiguration