import * as vscode from 'vscode';
import registerGPTCommand from './registerGPTCommand';
import { SideBarViewProvider } from './sideBarViewPanel';

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension is now active!');

	let disposable = vscode.commands.registerCommand('vscode-extension-vue.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from vscode-extension-vue!');
	});

	context.subscriptions.push(disposable);

	// 注册 GPT 相关的命令
	// registerGPTCommand(context)

	// Side Bar View Provider
	const provider = new SideBarViewProvider(context.extensionUri, context);

	context.subscriptions.push(vscode.window.registerWebviewViewProvider(SideBarViewProvider.viewType, provider));

}

export function deactivate() { }
