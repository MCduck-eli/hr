const cache = new Map<string, { data: any; timestamp: number }>();
export const DEFAULT_STALE_TIME = 5 * 60 * 1000;

export const getQueryData = <T>(key: string): T | null => {
    const entry = cache.get(key);
    if (!entry) return null;
    return entry.data as T;
};

export const isQueryStale = (key: string, staleTime: number = DEFAULT_STALE_TIME): boolean => {
    const entry = cache.get(key);
    if (!entry) return true;
    return Date.now() - entry.timestamp > staleTime;
};

export const setQueryData = <T>(key: string, data: T): void => {
    cache.set(key, { data, timestamp: Date.now() });
};

export const invalidateQuery = (keyOrPrefix: string): void => {
    for (const key of Array.from(cache.keys())) {
        if (key === keyOrPrefix || key.startsWith(`${keyOrPrefix}:`) || key.startsWith(keyOrPrefix)) {
            cache.delete(key);
        }
    }
};

export const clearQueryCache = (): void => {
    cache.clear();
};
