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

export type JsonFetcher = (url: string) => Promise<unknown>;

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
  kifliOrigin: string;
  port: number;
  protocolVersion: string;
  serverName: string;
  serverVersion: string;
};
