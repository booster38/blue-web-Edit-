export interface Node {
  id: string;
  type: 'input-image' | 'gen-image' | 'preview' | 'http' | 'js' | 'text' | 'ai';
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  prompt?: string;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  code?: string;
  input?: string;
  text?: string;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
}

export interface View {
  x: number;
  y: number;
  zoom: number;
}