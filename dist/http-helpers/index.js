"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDropNotificationParams = exports.parseOrdersScoringParams = exports.del = exports.get = exports.post = exports.request = exports.PUT = exports.DELETE = exports.POST = exports.GET = void 0;
const tslib_1 = require("tslib");
/* eslint-disable max-depth */
const axios_1 = tslib_1.__importDefault(require("axios"));
const https_proxy_agent_1 = require("https-proxy-agent");
const browser_or_node_1 = require("browser-or-node");
exports.GET = "GET";
exports.POST = "POST";
exports.DELETE = "DELETE";
exports.PUT = "PUT";
const overloadHeaders = (method, headers) => {
    if (browser_or_node_1.isBrowser) {
        return headers;
    }
    const overloadedHeaders = Object.assign({}, (headers !== null && headers !== void 0 ? headers : {}));
    overloadedHeaders["User-Agent"] = "@polymarket/clob-client";
    overloadedHeaders["Accept"] = "*/*";
    overloadedHeaders["Connection"] = "keep-alive";
    overloadedHeaders["Content-Type"] = "application/json";
    if (method === exports.GET) {
        overloadedHeaders["Accept-Encoding"] = "gzip";
    }
    return overloadedHeaders;
};
const parseProxyUrl = (proxyUrl) => {
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
        const protocol = parsedUrl.protocol.replace(":", "").toLowerCase();
        const proxyConfig = {
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
    }
    catch (error) {
        const reason = error instanceof Error ? error.message : "unknown error";
        throw new Error(`[CLOB Client] invalid proxy configuration for "${proxyUrl}": ${reason}`);
    }
};
const resolveProxyConfig = (options) => {
    if (browser_or_node_1.isBrowser) {
        return undefined;
    }
    if ((options === null || options === void 0 ? void 0 : options.proxy) === false) {
        return false;
    }
    if (options === null || options === void 0 ? void 0 : options.proxy) {
        return options.proxy;
    }
    if (options === null || options === void 0 ? void 0 : options.proxyUrl) {
        return parseProxyUrl(options.proxyUrl);
    }
    return undefined;
};
const buildProxyUrl = (proxyConfig) => {
    const protocol = proxyConfig.protocol || "http";
    const auth = proxyConfig.auth
        ? `${proxyConfig.auth.username}:${proxyConfig.auth.password}@`
        : "";
    return `${protocol}://${auth}${proxyConfig.host}:${proxyConfig.port}`;
};
const request = (endpoint, method, options = {}) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const headers = overloadHeaders(method, options.headers);
    const axiosConfig = {
        method,
        url: endpoint,
        headers,
        data: options.data,
        params: options.params,
    };
    const proxyConfig = resolveProxyConfig(options);
    if (proxyConfig === false) {
        axiosConfig.proxy = false;
    }
    else if (proxyConfig && !browser_or_node_1.isBrowser) {
        const isHttpsRequest = endpoint.startsWith("https://");
        const isHttpProxy = proxyConfig.protocol === "http" || !proxyConfig.protocol;
        // Use HttpsProxyAgent for HTTPS requests through HTTP proxy
        if (isHttpsRequest && isHttpProxy) {
            const agent = new https_proxy_agent_1.HttpsProxyAgent(buildProxyUrl(proxyConfig));
            axiosConfig.httpsAgent = agent;
            axiosConfig.httpAgent = agent;
        }
        else {
            axiosConfig.proxy = proxyConfig;
        }
    }
    return yield (0, axios_1.default)(axiosConfig);
});
exports.request = request;
const post = (endpoint, options) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const resp = yield (0, exports.request)(endpoint, exports.POST, options);
        return resp.data;
    }
    catch (err) {
        return errorHandling(err);
    }
});
exports.post = post;
const get = (endpoint, options) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const resp = yield (0, exports.request)(endpoint, exports.GET, options);
        return resp.data;
    }
    catch (err) {
        return errorHandling(err);
    }
});
exports.get = get;
const del = (endpoint, options) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    try {
        const resp = yield (0, exports.request)(endpoint, exports.DELETE, options);
        return resp.data;
    }
    catch (err) {
        return errorHandling(err);
    }
});
exports.del = del;
const errorHandling = (err) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    if (axios_1.default.isAxiosError(err)) {
        if (err.response) {
            console.error("[CLOB Client] request error", JSON.stringify({
                status: (_a = err.response) === null || _a === void 0 ? void 0 : _a.status,
                statusText: (_b = err.response) === null || _b === void 0 ? void 0 : _b.statusText,
                data: (_c = err.response) === null || _c === void 0 ? void 0 : _c.data,
                config: (_d = err.response) === null || _d === void 0 ? void 0 : _d.config,
            }));
            if ((_e = err.response) === null || _e === void 0 ? void 0 : _e.data) {
                if (typeof ((_f = err.response) === null || _f === void 0 ? void 0 : _f.data) === "string" ||
                    ((_g = err.response) === null || _g === void 0 ? void 0 : _g.data) instanceof String) {
                    return { error: (_h = err.response) === null || _h === void 0 ? void 0 : _h.data, status: (_j = err.response) === null || _j === void 0 ? void 0 : _j.status };
                }
                if (!Object.prototype.hasOwnProperty.call((_k = err.response) === null || _k === void 0 ? void 0 : _k.data, "error")) {
                    return { error: (_l = err.response) === null || _l === void 0 ? void 0 : _l.data, status: (_m = err.response) === null || _m === void 0 ? void 0 : _m.status };
                }
                // in this case the field 'error' is included
                return Object.assign(Object.assign({}, (_o = err.response) === null || _o === void 0 ? void 0 : _o.data), { status: (_p = err.response) === null || _p === void 0 ? void 0 : _p.status });
            }
        }
        if (err.message) {
            console.error("[CLOB Client] request error", JSON.stringify({
                error: err.message,
            }));
            return { error: err.message };
        }
    }
    console.error("[CLOB Client] request error", err);
    return { error: err };
};
const parseOrdersScoringParams = (orderScoringParams) => {
    const params = {};
    if (orderScoringParams !== undefined) {
        if (orderScoringParams.orderIds !== undefined) {
            params["order_ids"] = orderScoringParams === null || orderScoringParams === void 0 ? void 0 : orderScoringParams.orderIds.join(",");
        }
    }
    return params;
};
exports.parseOrdersScoringParams = parseOrdersScoringParams;
const parseDropNotificationParams = (dropNotificationParams) => {
    const params = {};
    if (dropNotificationParams !== undefined) {
        if (dropNotificationParams.ids !== undefined) {
            params["ids"] = dropNotificationParams === null || dropNotificationParams === void 0 ? void 0 : dropNotificationParams.ids.join(",");
        }
    }
    return params;
};
exports.parseDropNotificationParams = parseDropNotificationParams;
//# sourceMappingURL=index.js.map