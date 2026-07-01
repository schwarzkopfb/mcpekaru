import type { ServerResponse } from 'node:http';

export type ProductSummary = {
  id: string;
  name: string;
  url?: string;
  price?: string;
};

export type ProductDetails = ProductSummary & {
  description?: string;
  brand?: string;
  image?: string;
  attributes: Record<string, string>;
};

export type BrowserPage = {
  setExtraHTTPHeaders?(headers: Record<string, string>): Promise<void>;
  goto(
    url: string,
    options: {
      waitUntil: 'domcontentloaded' | 'networkidle2';
      timeout: number;
    },
  ): Promise<unknown>;
  content(): Promise<string>;
};

export type Browser = {
  newPage(): Promise<BrowserPage>;
  close(): Promise<void>;
};

export type BrowserFactory = () => Promise<Browser>;

export type JsonRpcRequest = {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: unknown;
};

export type JsonRpcResponse = {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string };
};

export type McpDependencies = {
  search?: (query: string) => Promise<ProductSummary[]>;
  details?: (idOrUrl: string) => Promise<ProductDetails>;
};

export type Session = { res: ServerResponse };

export type Config = {
  browserTimeoutMs: number;
  kifliOrigin: string;
  port: number;
  protocolVersion: string;
  serverName: string;
  serverVersion: string;
};
