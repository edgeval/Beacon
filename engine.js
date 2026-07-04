/**
 * BeaconEngine · 智能线路测速与动态路由调度引擎
 * @author Colton Flynn
 * @license MIT
 * @note 
 * 1. 评分权重：建议在 JSON 配置中将 currentWeight 与 historyWeight 两项权重总和保持为 1。
 * 2. 探测协议：默认采用 HTTPS 探测。若目标站点仅提供 HTTP，请将 protocolMode 设为 "http" 或 "auto"。
 * 3. 探测模式：支持 probeMode ("auto" | "cors" | "opaque")。默认 auto 模式具备跨域能力探知、无相降级与 TTL 自愈缓存机制。
 */
class BeaconEngine {

    static VERSION = "1.0.0";

    constructor(options = {}) {
        this.timeout = Number(options.timeoutMs) || 5000;
        this.concurrency = Number(options.concurrency) || 3;
        this.pingCount = Number(options.pingCount) || 3;
        
        const mode = (options.protocolMode || 'https').toLowerCase();
        this.protocolMode = ['https', 'http', 'auto'].includes(mode) ? mode : 'https';

        const pMode = (options.probeMode || 'auto').toLowerCase();
        this.probeMode = ['auto', 'cors', 'opaque'].includes(pMode) ? pMode : 'auto';

        this.capabilityTtl = Number(options.capabilityTtl) || 3600000;

        this.resources = (Array.isArray(options.resources) && options.resources.length > 0)
            ? options.resources
            : [
                '/favicon.ico', 
                '/robots.txt', 
                '/apple-touch-icon.png', 
                '/site.webmanifest', 
                '/favicon.png'
            ];

        this.currentWeight = options.currentWeight ?? 0.8;
        this.historyWeight = options.historyWeight ?? 0.2;
        this.timeoutPenalty = options.timeoutPenalty ?? 500;

        this._stats = new Map();
        this._capabilityCache = new Map();
        this._activeControllers = new Set();
        this._destroyed = false;
        
        // 🌟 修复 ①：引入会话代际 ID (Generation ID)，彻底消灭异步竞态与旧任务复活
        this._sessionId = 0;
    }

    _initDomainStat(domain) {
        if (!this._stats.has(domain)) {
            this._stats.set(domain, { reqIdx: 0, pings: [], consecutiveTO: 0 });
        }
        return this._stats.get(domain);
    }

    _getTargetUrl(domain) {
        if (domain.startsWith('http://') || domain.startsWith('https://')) {
            return domain;
        }
        if (this.protocolMode === 'http') {
            return 'http://' + domain;
        }
        if (this.protocolMode === 'auto') {
            const defaultProtocol = (typeof location !== 'undefined' && location.protocol === 'http:') ? 'http://' : 'https://';
            return defaultProtocol + domain;
        }
        return 'https://' + domain;
    }

    getTargetUrl(domain) {
        return this._getTargetUrl(domain);
    }

    _getCachedCapability(domain) {
        const cached = this._capabilityCache.get(domain);
        if (!cached) return null;
        if (Date.now() > cached.expireAt) {
            this._capabilityCache.delete(domain);
            return null;
        }
        return cached.mode;
    }

    _setCachedCapability(domain, mode) {
        this._capabilityCache.set(domain, {
            mode: mode,
            expireAt: Date.now() + this.capabilityTtl
        });
    }

    async _pingSingle(domain, path, fetchMode) {
        if (this._destroyed) return Number.MAX_SAFE_INTEGER;

        const targetUrl = this._getTargetUrl(domain);
        const start = performance.now();
        const controller = new AbortController();
        
        this._activeControllers.add(controller);
        const timer = setTimeout(() => controller.abort(), this.timeout);

        try {
            const nonce = `${performance.now()}_${Math.random().toString(36).substring(2, 8)}`;
            const response = await fetch(`${targetUrl}${path}?t=${nonce}`, {
                mode: fetchMode,
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' },
                signal: controller.signal
            });

            if (fetchMode === 'cors' && !response.ok) {
                return Number.MAX_SAFE_INTEGER;
            }

            return Math.round(performance.now() - start);
        } catch (e) {
            throw e;
        } finally {
            clearTimeout(timer);
            this._activeControllers.delete(controller);
        }
    }

    async pingDomain(domain) {
        if (this._destroyed) return Number.MAX_SAFE_INTEGER;

        const stat = this._initDomainStat(domain);
        const promises = [];

        for (let i = 0; i < this.pingCount; i++) {
            const path = this.resources[stat.reqIdx % this.resources.length];
            stat.reqIdx++;
            promises.push(new Promise(resolve => {
                setTimeout(async () => {
                    if (this._destroyed) return resolve(Number.MAX_SAFE_INTEGER);

                    let currentFetchMode = 'no-cors';
                    if (this.probeMode === 'cors') {
                        currentFetchMode = 'cors';
                    } else if (this.probeMode === 'auto') {
                        currentFetchMode = this._getCachedCapability(domain) || 'cors';
                    }

                    try {
                        const ms = await this._pingSingle(domain, path, currentFetchMode);
                        
                        if (this.probeMode === 'auto' && currentFetchMode === 'cors' && ms < Number.MAX_SAFE_INTEGER) {
                            this._setCachedCapability(domain, 'cors');
                        }
                        resolve(ms);
                    } catch (e) {
                        // 🌟 修复 ②：精准拦截 AbortError！
                        // 无论是超时还是主动调用 destroy 引起的 abort，均直接中止，严禁禁入 no-cors 降级发包！
                        if (this._destroyed || e.name === 'AbortError') {
                            return resolve(Number.MAX_SAFE_INTEGER);
                        }

                        // 只有处于 cors 试探期且真实网络断裂/跨域阻断时，才允许尝试 no-cors 降级证伪
                        if (currentFetchMode === 'cors' && this.probeMode === 'auto') {
                            try {
                                const fallbackMs = await this._pingSingle(domain, path, 'no-cors');
                                
                                if (fallbackMs < Number.MAX_SAFE_INTEGER) {
                                    this._setCachedCapability(domain, 'opaque');
                                }
                                resolve(fallbackMs);
                            } catch (err) {
                                resolve(Number.MAX_SAFE_INTEGER);
                            }
                        } else {
                            resolve(Number.MAX_SAFE_INTEGER);
                        }
                    }
                }, i * (Math.floor(Math.random() * 20) + 50)); 
            }));
        }

        const samples = await Promise.all(promises);
        if (this._destroyed) return Number.MAX_SAFE_INTEGER;

        const valid = samples.filter(s => s < Number.MAX_SAFE_INTEGER).sort((a, b) => a - b);
        
        if (valid.length === 0) {
            stat.consecutiveTO++;
            return Number.MAX_SAFE_INTEGER;
        }

        if (valid.length >= 3 && valid[valid.length - 1] > valid[valid.length - 2] * 2.5 && valid[valid.length - 1] > 300) {
            valid.pop();
        }

        const mid = Math.floor(valid.length / 2);
        const median = valid.length % 2 !== 0 
            ? valid[mid] 
            : Math.round((valid[mid - 1] + valid[mid]) / 2);

        stat.consecutiveTO = 0;
        stat.pings.push(median);
        if (stat.pings.length > 5) stat.pings.shift();

        return median;
    }

    getScore(domain, current) {
        const stat = this._initDomainStat(domain);
        if (stat.consecutiveTO >= 3) return Number.MAX_SAFE_INTEGER;
        if (current >= Number.MAX_SAFE_INTEGER) return Number.MAX_SAFE_INTEGER;

        const mean = stat.pings.length > 0 
            ? stat.pings.reduce((a, b) => a + b, 0) / stat.pings.length 
            : current;

        return Math.round((current * this.currentWeight) + (mean * this.historyWeight) + (stat.consecutiveTO * this.timeoutPenalty));
    }

    /**
     * Promise 并发任务池 (Worker-pool 风格调度)
     * 采用会话代际校验 (Session ID) + 队列消费机制，彻底杜绝任务竞态与旧进程复活
     */
    async runPool(domains, onProgress) {
        this._destroyed = false;
        // 🌟 修复 ①：每次调起任务池，会话代际自增
        const currentSession = ++this._sessionId;
        let index = 0;
        
        const workers = new Array(Math.min(this.concurrency, domains.length))
            .fill(0)
            .map(async () => {
                // 🌟 修复 ①：严格比对 currentSession，一旦用户调用 destroy 或触发新 runPool，旧 Worker 瞬间静默死亡
                while (index < domains.length && !this._destroyed && this._sessionId === currentSession) {
                    const currentIndex = index++;
                    const domain = domains[currentIndex];
                    try {
                        const median = await this.pingDomain(domain);
                        if (!this._destroyed && this._sessionId === currentSession && typeof onProgress === 'function') {
                            onProgress(currentIndex, median);
                        }
                    } catch (e) {
                        if (!this._destroyed && this._sessionId === currentSession && typeof onProgress === 'function') {
                            onProgress(currentIndex, Number.MAX_SAFE_INTEGER);
                        }
                    }
                }
            });

        await Promise.allSettled(workers);
    }

    // 物理销毁：立起红旗、自增代际 ID、暴力中止所有连接并清空缓存
    destroy() {
        this._destroyed = true;
        // 🌟 修复 ①：自增会话 ID，彻底剥夺任何残余异步宏任务/微任务的回调执行权
        this._sessionId++;
        
        this._activeControllers.forEach(controller => {
            try {
                controller.abort();
            } catch (e) {}
        });
        this._activeControllers.clear();
        this._stats.clear();
        this._capabilityCache.clear();
    }
}