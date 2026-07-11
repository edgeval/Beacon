/**
 * BeaconEngine · 浏览器端线路测速与动态路由调度引擎
 * @author Colton Flynn
 * @license MIT
 */
class BeaconEngine {
    static VERSION = "1.1.0";
    static UNAVAILABLE = Number.MAX_SAFE_INTEGER;

    constructor(options = {}) {
        this.timeout = BeaconEngine._toInteger(options.timeoutMs, 5000, 500, 30000);
        this.concurrency = BeaconEngine._toInteger(options.concurrency, 3, 1, 12);
        this.pingCount = BeaconEngine._toInteger(options.pingCount, 3, 1, 10);

        const mode = String(options.protocolMode || 'https').toLowerCase();
        this.protocolMode = ['https', 'http', 'auto'].includes(mode) ? mode : 'https';

        const probeMode = String(options.probeMode || 'auto').toLowerCase();
        this.probeMode = ['auto', 'cors', 'opaque'].includes(probeMode) ? probeMode : 'auto';

        this.capabilityTtl = BeaconEngine._toInteger(
            options.capabilityTtl,
            3600000,
            60000,
            86400000
        );

        const configuredResources = Array.isArray(options.resources)
            ? options.resources
                .filter(item => typeof item === 'string')
                .map(item => item.trim())
                .filter(Boolean)
            : [];

        this.resources = configuredResources.length > 0
            ? configuredResources
            : ['/favicon.ico', '/robots.txt', '/apple-touch-icon.png', '/site.webmanifest', '/favicon.png'];

        const currentWeight = BeaconEngine._toNumber(options.currentWeight, 0.8, 0, 1);
        const historyWeight = BeaconEngine._toNumber(options.historyWeight, 0.2, 0, 1);
        const weightTotal = currentWeight + historyWeight;

        if (weightTotal > 0) {
            this.currentWeight = currentWeight / weightTotal;
            this.historyWeight = historyWeight / weightTotal;
        } else {
            this.currentWeight = 1;
            this.historyWeight = 0;
        }

        this.timeoutPenalty = BeaconEngine._toNumber(options.timeoutPenalty, 500, 0, 10000);

        this._stats = new Map();
        this._capabilityCache = new Map();
        this._activeControllers = new Set();
        this._destroyed = false;
        this._sessionId = 0;
    }

    static _toInteger(value, fallback, min, max) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return fallback;
        return Math.min(max, Math.max(min, Math.round(parsed)));
    }

    static _toNumber(value, fallback, min, max) {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return fallback;
        return Math.min(max, Math.max(min, parsed));
    }

    static _isHttpUrl(url) {
        return url.protocol === 'http:' || url.protocol === 'https:';
    }

    _initDomainStat(domain) {
        if (!this._stats.has(domain)) {
            this._stats.set(domain, {
                reqIdx: 0,
                pings: [],
                consecutiveTO: 0,
                previousMean: null,
                lastPenaltyCount: 0
            });
        }
        return this._stats.get(domain);
    }

    _getDefaultProtocol() {
        if (this.protocolMode === 'http') return 'http:';
        if (this.protocolMode === 'https') return 'https:';

        return typeof location !== 'undefined' && location.protocol === 'http:'
            ? 'http:'
            : 'https:';
    }

    _parseTarget(domain) {
        if (typeof domain !== 'string' || !domain.trim()) {
            throw new TypeError('Route must be a non-empty string.');
        }

        const raw = domain.trim();
        const hasScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(raw);
        const candidate = hasScheme ? raw : `${this._getDefaultProtocol()}//${raw}`;
        const url = new URL(candidate);

        if (!BeaconEngine._isHttpUrl(url)) {
            throw new TypeError('Only HTTP and HTTPS routes are supported.');
        }

        if (url.username || url.password) {
            throw new TypeError('Routes containing credentials are not supported.');
        }

        return url;
    }

    _getTargetUrl(domain) {
        return this._parseTarget(domain).href;
    }

    getTargetUrl(domain) {
        return this._getTargetUrl(domain);
    }

    _buildProbeUrl(domain, path) {
        const target = this._parseTarget(domain);
        const probe = new URL(path, target);
        probe.searchParams.set('_beacon_t', `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
        return probe.href;
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
            mode,
            expireAt: Date.now() + this.capabilityTtl
        });
    }

    async _pingSingle(domain, path, fetchMode) {
        if (this._destroyed) return BeaconEngine.UNAVAILABLE;

        const probeUrl = this._buildProbeUrl(domain, path);
        const start = performance.now();
        const controller = new AbortController();

        this._activeControllers.add(controller);
        const timer = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(probeUrl, {
                mode: fetchMode,
                cache: 'no-store',
                credentials: 'omit',
                redirect: 'follow',
                signal: controller.signal
            });

            if (fetchMode === 'cors' && !response.ok) {
                return BeaconEngine.UNAVAILABLE;
            }

            return Math.round(performance.now() - start);
        } finally {
            clearTimeout(timer);
            this._activeControllers.delete(controller);
        }
    }

    async pingDomain(domain) {
        if (this._destroyed) return BeaconEngine.UNAVAILABLE;

        // 在发起请求前验证一次，避免每个采样都重复抛出格式错误。
        try {
            this._parseTarget(domain);
        } catch (error) {
            return BeaconEngine.UNAVAILABLE;
        }

        const stat = this._initDomainStat(domain);
        const promises = [];

        for (let i = 0; i < this.pingCount; i++) {
            const path = this.resources[stat.reqIdx % this.resources.length];
            stat.reqIdx += 1;

            promises.push(new Promise(resolve => {
                const stagger = i * (Math.floor(Math.random() * 20) + 50);

                setTimeout(async () => {
                    if (this._destroyed) {
                        resolve(BeaconEngine.UNAVAILABLE);
                        return;
                    }

                    let currentFetchMode = 'no-cors';
                    if (this.probeMode === 'cors') {
                        currentFetchMode = 'cors';
                    } else if (this.probeMode === 'auto') {
                        currentFetchMode = this._getCachedCapability(domain) || 'cors';
                    }

                    try {
                        const ms = await this._pingSingle(domain, path, currentFetchMode);

                        if (
                            this.probeMode === 'auto' &&
                            currentFetchMode === 'cors' &&
                            ms < BeaconEngine.UNAVAILABLE
                        ) {
                            this._setCachedCapability(domain, 'cors');
                        }

                        resolve(ms);
                    } catch (error) {
                        if (this._destroyed || error.name === 'AbortError') {
                            resolve(BeaconEngine.UNAVAILABLE);
                            return;
                        }

                        if (currentFetchMode === 'cors' && this.probeMode === 'auto') {
                            try {
                                const fallbackMs = await this._pingSingle(domain, path, 'no-cors');

                                if (fallbackMs < BeaconEngine.UNAVAILABLE) {
                                    this._setCachedCapability(domain, 'opaque');
                                }

                                resolve(fallbackMs);
                            } catch (fallbackError) {
                                resolve(BeaconEngine.UNAVAILABLE);
                            }
                        } else {
                            resolve(BeaconEngine.UNAVAILABLE);
                        }
                    }
                }, stagger);
            }));
        }

        const samples = await Promise.all(promises);
        if (this._destroyed) return BeaconEngine.UNAVAILABLE;

        const valid = samples
            .filter(sample => Number.isFinite(sample) && sample < BeaconEngine.UNAVAILABLE)
            .sort((a, b) => a - b);

        if (valid.length === 0) {
            stat.consecutiveTO += 1;
            stat.lastPenaltyCount = stat.consecutiveTO;
            return BeaconEngine.UNAVAILABLE;
        }

        if (
            valid.length >= 3 &&
            valid[valid.length - 1] > valid[valid.length - 2] * 2.5 &&
            valid[valid.length - 1] > 300
        ) {
            valid.pop();
        }

        const mid = Math.floor(valid.length / 2);
        const median = valid.length % 2 !== 0
            ? valid[mid]
            : Math.round((valid[mid - 1] + valid[mid]) / 2);

        // previousMean 只包含此前成功测速，避免把本次结果重复计入“历史权重”。
        stat.previousMean = stat.pings.length > 0
            ? stat.pings.reduce((sum, value) => sum + value, 0) / stat.pings.length
            : null;

        // 如果此前连续失败，本次成功仍会承受一次惩罚，之后恢复正常。
        stat.lastPenaltyCount = stat.consecutiveTO;
        stat.consecutiveTO = 0;
        stat.pings.push(median);
        if (stat.pings.length > 5) stat.pings.shift();

        return median;
    }

    getScore(domain, current) {
        const stat = this._initDomainStat(domain);

        if (!Number.isFinite(current) || current >= BeaconEngine.UNAVAILABLE) {
            return BeaconEngine.UNAVAILABLE;
        }

        const history = Number.isFinite(stat.previousMean) ? stat.previousMean : current;
        const penalty = stat.lastPenaltyCount * this.timeoutPenalty;

        return Math.round(
            current * this.currentWeight +
            history * this.historyWeight +
            penalty
        );
    }

    async runPool(domains, onProgress) {
        this._destroyed = false;
        const currentSession = ++this._sessionId;
        let index = 0;

        const workerCount = Math.min(this.concurrency, domains.length);
        const workers = new Array(workerCount).fill(0).map(async () => {
            while (
                index < domains.length &&
                !this._destroyed &&
                this._sessionId === currentSession
            ) {
                const currentIndex = index++;
                const domain = domains[currentIndex];

                try {
                    const median = await this.pingDomain(domain);
                    if (
                        !this._destroyed &&
                        this._sessionId === currentSession &&
                        typeof onProgress === 'function'
                    ) {
                        onProgress(currentIndex, median);
                    }
                } catch (error) {
                    if (
                        !this._destroyed &&
                        this._sessionId === currentSession &&
                        typeof onProgress === 'function'
                    ) {
                        onProgress(currentIndex, BeaconEngine.UNAVAILABLE);
                    }
                }
            }
        });

        await Promise.allSettled(workers);
    }

    cancelCurrentRun() {
        this._sessionId += 1;
        this._activeControllers.forEach(controller => {
            try {
                controller.abort();
            } catch (error) {
                // 控制器可能已经结束，无需额外处理。
            }
        });
        this._activeControllers.clear();
    }

    destroy() {
        this._destroyed = true;
        this.cancelCurrentRun();
        this._stats.clear();
        this._capabilityCache.clear();
    }
}
