'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/** useFetch 回傳型別 */
interface UseFetchResult<T> {
  /** 資料 */
  data: T | null;
  /** 載入中 */
  loading: boolean;
  /** 錯誤訊息 */
  error: string | null;
  /** 手動重新請求 */
  refetch: () => void;
}

/** useFetch 選項 */
interface UseFetchOptions<T> {
  /** 初始資料 */
  initialData?: T | null;
  /** 是否在 mount 時自動請求 */
  immediate?: boolean;
  /** 成功時的回調 */
  onSuccess?: (data: T) => void;
  /** 失敗時的回調 */
  onError?: (error: string) => void;
}

/**
 * 通用 API 請求 Hook
 *
 * 內建 AbortController 防止 React Strict Mode 重複請求
 *
 * @param url - API URL（null 時不發送請求）
 * @param deps - 依賴項，變化時重新請求
 * @param options - 選項
 */
export function useFetch<T>(
  url: string | null,
  deps: React.DependencyList = [],
  options: UseFetchOptions<T> = {}
): UseFetchResult<T> {
  const { initialData = null, immediate = true, onSuccess, onError } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(immediate && url !== null);
  const [error, setError] = useState<string | null>(null);

  // 用 ref 保存 callbacks 避免加入依賴
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const fetchData = useCallback(
    async (signal: AbortSignal) => {
      if (!url) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(url, { signal });
        const json = await res.json();

        if (json.success) {
          setData(json.data);
          onSuccessRef.current?.(json.data);
        } else {
          const errorMsg = json.error || '載入失敗';
          setError(errorMsg);
          onErrorRef.current?.(errorMsg);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return; // 請求被取消，不處理
        }
        const errorMsg = '網路錯誤';
        setError(errorMsg);
        onErrorRef.current?.(errorMsg);
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [url]
  );

  // 自動請求
  useEffect(() => {
    if (!immediate || !url) return;

    const abortController = new AbortController();
    fetchData(abortController.signal);

    return () => {
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);

  // 手動重新請求
  const refetch = useCallback(() => {
    const abortController = new AbortController();
    fetchData(abortController.signal);
  }, [fetchData]);

  return { data, loading, error, refetch };
}

/**
 * 手動控制的 API 請求 Hook
 *
 * 不會自動發送請求，需要手動呼叫 execute
 */
export function useLazyFetch<T>(): {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (url: string) => Promise<T | null>;
  reset: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (url: string): Promise<T | null> => {
    // 取消前一個請求
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(url, { signal: abortControllerRef.current.signal });
      const json = await res.json();

      if (json.success) {
        setData(json.data);
        return json.data;
      } else {
        const errorMsg = json.error || '載入失敗';
        setError(errorMsg);
        return null;
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return null;
      }
      setError('網路錯誤');
      return null;
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return { data, loading, error, execute, reset };
}
