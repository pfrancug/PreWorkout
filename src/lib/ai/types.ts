export interface IChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

export interface IAIConfig {
  systemInstruction: string;
  messages: IChatMessage[];
  userMessage: string;
  authToken?: string;
}
