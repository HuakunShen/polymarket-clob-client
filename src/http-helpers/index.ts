/* eslint-disable max-depth */
import axios, { AxiosProxyConfig, AxiosRequestConfig, AxiosRequestHeaders, Method } from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import { DropNotificationParams, OrdersScoringParams } from "src/types";
import { isBrowser } from "browser-or-node";

export const GET = "GET";
export const POST = "POST";
export const DELETE = "DELETE";
export const PUT = "PUT";

const overloadHeaders = (
    method: Method,
    headers?: AxiosRequestHeaders,
): AxiosRequestHeaders | undefined => {
    if (isBrowser) {
        return headers;
    }

    const overloadedHeaders: AxiosRequestHeaders = { ...(headers ?? {}) };
    overloadedHeaders["User-Agent"] = "@polymarket/clob-client";
    overloadedHeaders["Accept"] = "*/*";
    overloadedHeaders["Connection"] = "keep-alive";
    overloadedHeaders["Content-Type"] = "application/json";

    if (method === GET) {
        overloadedHeaders["Accept-Encoding"] = "gzip";
    }

    return overloadedHeaders;
};

const parseProxyUrl = (proxyUrl: string): AxiosProxyConfig => {
    try {
        const parsedUrl = new URL(proxyUrl);
        if (!parsedUrl.hostname) {
            throw new Error("proxy host is missing");
        }

        const defaultPort = parsedUrl.protocol === "https:" ? 443 : 80;
        const port = parsedUrl.port ? Number(parsedUrl.port) : defaultPort;

        if (Number.isNaN(port)) {
            throw new Error("invalid proxy port");
        }

        const protocol = parsedUrl.protocol.replace(":", "").toLowerCase() as "http" | "https";
        const proxyConfig: AxiosProxyConfig = {
            host: parsedUrl.hostname,
            port,
            protocol,
        };

        if (parsedUrl.username || parsedUrl.password) {
            proxyConfig.auth = {
                username: decodeURIComponent(parsedUrl.username),
                password: decodeURIComponent(parsedUrl.password),
            };
        }

        return proxyConfig;
    } catch (error) {
        const reason = error instanceof Error ? error.message : "unknown error";
        throw new Error(`[CLOB Client] invalid proxy configuration for "${proxyUrl}": ${reason}`);
    }
};

const resolveProxyConfig = (options?: RequestOptions): AxiosProxyConfig | false | undefined => {
    if (isBrowser) {
        return undefined;
    }

    if (options?.proxy === false) {
        return false;
    }

    if (options?.proxy) {
        return options.proxy;
    }

    if (options?.proxyUrl) {
        return parseProxyUrl(options.proxyUrl);
    }

    return undefined;
};

const buildProxyUrl = (proxyConfig: AxiosProxyConfig): string => {
    const protocol = proxyConfig.protocol || "http";
    const auth = proxyConfig.auth
        ? `${proxyConfig.auth.username}:${proxyConfig.auth.password}@`
        : "";
    return `${protocol}://${auth}${proxyConfig.host}:${proxyConfig.port}`;
};

export const request = async (
    endpoint: string,
    method: Method,
    options: RequestOptions = {},
): Promise<any> => {
    const headers = overloadHeaders(method, options.headers);
    const axiosConfig: AxiosRequestConfig = {
        method,
        url: endpoint,
        headers,
        data: options.data,
        params: options.params,
    };

    const proxyConfig = resolveProxyConfig(options);
    if (proxyConfig === false) {
        axiosConfig.proxy = false;
    } else if (proxyConfig && !isBrowser) {
        const isHttpsRequest = endpoint.startsWith("https://");
        const isHttpProxy = proxyConfig.protocol === "http" || !proxyConfig.protocol;

        // Use HttpsProxyAgent for HTTPS requests through HTTP proxy
        if (isHttpsRequest && isHttpProxy) {
            const agent = new HttpsProxyAgent(buildProxyUrl(proxyConfig));
            axiosConfig.httpsAgent = agent;
            axiosConfig.httpAgent = agent;
        } else {
            axiosConfig.proxy = proxyConfig;
        }
    }

    return await axios(axiosConfig);
};

export type QueryParams = Record<string, any>;

export interface RequestOptions {
    headers?: AxiosRequestHeaders;
    data?: any;
    params?: QueryParams;
    proxy?: AxiosProxyConfig | false;
    proxyUrl?: string;
}

export const post = async (endpoint: string, options?: RequestOptions): Promise<any> => {
    try {
        const resp = await request(endpoint, POST, options);
        return resp.data;
    } catch (err: unknown) {
        return errorHandling(err);
    }
};

export const get = async (endpoint: string, options?: RequestOptions): Promise<any> => {
    try {
        const resp = await request(endpoint, GET, options);
        return resp.data;
    } catch (err: unknown) {
        return errorHandling(err);
    }
};

export const del = async (endpoint: string, options?: RequestOptions): Promise<any> => {
    try {
        const resp = await request(endpoint, DELETE, options);
        return resp.data;
    } catch (err: unknown) {
        return errorHandling(err);
    }
};

const errorHandling = (err: unknown) => {
    if (axios.isAxiosError(err)) {
        if (err.response) {
            console.error(
                "[CLOB Client] request error",
                JSON.stringify({
                    status: err.response?.status,
                    statusText: err.response?.statusText,
                    data: err.response?.data,
                    config: err.response?.config,
                }),
            );
            if (err.response?.data) {
                if (
                    typeof err.response?.data === "string" ||
                    err.response?.data instanceof String
                ) {
                    return { error: err.response?.data, status: err.response?.status };
                }
                if (!Object.prototype.hasOwnProperty.call(err.response?.data, "error")) {
                    return { error: err.response?.data, status: err.response?.status };
                }
                // in this case the field 'error' is included
                return { ...err.response?.data, status: err.response?.status };
            }
        }

        if (err.message) {
            console.error(
                "[CLOB Client] request error",
                JSON.stringify({
                    error: err.message,
                }),
            );
            return { error: err.message };
        }
    }

    console.error("[CLOB Client] request error", err);
    return { error: err };
};

export const parseOrdersScoringParams = (orderScoringParams?: OrdersScoringParams): QueryParams => {
    const params: QueryParams = {};
    if (orderScoringParams !== undefined) {
        if (orderScoringParams.orderIds !== undefined) {
            params["order_ids"] = orderScoringParams?.orderIds.join(",");
        }
    }
    return params;
};

export const parseDropNotificationParams = (
    dropNotificationParams?: DropNotificationParams,
): QueryParams => {
    const params: QueryParams = {};
    if (dropNotificationParams !== undefined) {
        if (dropNotificationParams.ids !== undefined) {
            params["ids"] = dropNotificationParams?.ids.join(",");
        }
    }
    return params;
};
