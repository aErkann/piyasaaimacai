export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export interface ApiRequestConfig {
    method: HttpMethod;
    path: string;
    body?: unknown;
    headers?: Record<string, string>;
    timeout?: number;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data: T | null;
    error: string | null;
    timestamp: string;
}
export declare function backendRequest<T>(config: ApiRequestConfig): Promise<ApiResponse<T>>;
export declare function coingeckoFetch(endpoint: string, params?: Record<string, string>): Promise<any>;
export declare function dexScreenerFetch(endpoint: string): Promise<any>;
export declare function apiFootballFetch(endpoint: string, params?: Record<string, string>): Promise<any>;
export declare function openAIFetch(prompt: string, systemPrompt?: string): Promise<any>;
export declare function geminiFetch(prompt: string): Promise<any>;
//# sourceMappingURL=client.d.ts.map