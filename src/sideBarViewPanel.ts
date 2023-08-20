import * as vscode from 'vscode';
import { getAsWebviewUri } from './util';
import path from 'path';
import fs from 'fs';

export class SideBarViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'chat-gpt-view-id';
	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _context: vscode.ExtensionContext,
	) {
		console.log('SideBarViewProvider');
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {

		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
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

		// webviewView.webview.html = this._getHtmlForWebview(webviewView.webview, this._extensionUri);
		webviewView.webview.html = updatedHtmlContent


		// Register message events that comes from the js.
		this.addReceiveMessageEvents(webviewView.webview);
	}

	/**
	 * Add listener for event comes from js.
	 * @param webview :vscode.Webview
	 */
	private addReceiveMessageEvents(webview: vscode.Webview) {
		webview.onDidReceiveMessage((message: any) => {
			console.log('onDidReceiveMessage', message);
			// const command = message.command;
			// switch (command) {
			// 	case "start-chat-command":
			// 		this.startChatGptWebViewPanel();
			// 		break;

			// 	case "image-buton-clicked-command":
			// 		this.startImageWebViewPanel();
			// 		break;
			// 	case "save-settings":
			// 		setStoreData(this._context, message.data);
			// 		const responseMessage = `Settings saved successfully.`;
			// 		vscode.window.showInformationMessage(responseMessage);
			// 		break;
			// }
		},
			undefined
		);
	}
}