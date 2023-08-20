import * as vscode from 'vscode';
import registerPanelCommand from './registerPanelCommand';


export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension is now active!');

	let disposable = vscode.commands.registerCommand('vscode-extension-vue.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from vscode-extension-vue!');
	});

	context.subscriptions.push(disposable);

	// 注册 GPT 相关的命令
	registerPanelCommand(context)
}

export function deactivate() { }
