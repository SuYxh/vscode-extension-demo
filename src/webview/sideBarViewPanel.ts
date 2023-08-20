import * as vscode from 'vscode';
import { getAsWebviewUri, showError, alert } from '../util';
import path from 'path';
import fs from 'fs';
import Communication from '../communication/index';

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

export class SideBarViewProvider implements vscode.WebviewViewProvider {

  public static readonly viewType = 'chat-gpt-view-id';
  private static instance: SideBarViewProvider | null = null;
  private context: vscode.ExtensionContext
  public _view?: vscode.WebviewView;
  public communication: Communication | null

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext,
  ) {
    console.log('SideBarViewProvider');
    this.context = _context
    this.communication = null
  }

  /**
   * @description: 获取实例
   * @param {vscode} context
   * @return {*}
   */
  public static getInstance(context: vscode.ExtensionContext): SideBarViewProvider {
    if (!SideBarViewProvider.instance) {
      SideBarViewProvider.instance = new SideBarViewProvider(context.extensionUri, context);
    }
    return SideBarViewProvider.instance;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {

    this._view = webviewView;

    webviewView.webview.options = {
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

    webviewView.webview.html = updatedHtmlContent

    this.communication = Communication.getInstance(webviewView.webview)
  }

  /**
   * @description: 获取 WebviewView
   * @return {*}
   */
  public getWebview(): vscode.WebviewView | undefined {
    return this._view;
  }
}