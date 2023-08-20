import * as vscode from 'vscode';

export function showWebViewInSidebar(): boolean {
    return vscode.workspace.getConfiguration('extension').get('showWebViewInSidebar', true);
}
