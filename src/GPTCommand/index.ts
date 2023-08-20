import * as vscode from 'vscode';

function registerGPTCommand(context: vscode.ExtensionContext,handleOpenWebview: Function) {
  
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

      try {
        handleOpenWebview('test', data)
      } catch (error) {
        console.log('解释代码 -- handleOpenWebview', error);
      }
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

export default registerGPTCommand