export interface MessageType {
  from: 'vscode' | 'other' | 'chat-gpt-web'
  msgId: string
  method: string
  data: any
}