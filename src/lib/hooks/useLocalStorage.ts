'use client';

import {
  startTransition,
  useState,
  useEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from 'react';

/**
 * 解析 localStorage 儲存的 JSON 字串，並套用可選的 transform。
 * JSON 格式損壞時直接拋出 SyntaxError（Fail-Fast，不靜默吞錯）。
 */
export function parseStoredValue<T>(stored: string, transform?: (parsed: T) => T): T {
  const parsed = JSON.parse(stored) as T;
  return transform ? transform(parsed) : parsed;
}

/**
 * 通用 localStorage hook
 * - SSR 安全（useEffect 確保只在 client 執行）
 * - JSON parse/stringify
 * - isLoaded 狀態管理（避免 hydration mismatch）
 * - Fail-Fast：JSON 損壞時拋出 SyntaxError
 *
 * @param key localStorage key（mount 後不應改變）
 * @param defaultValue 無資料時的預設值
 * @param options.transform 讀取後的資料轉換（mount 後不應改變）
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  options?: { transform?: (parsed: T) => T }
): [T, Dispatch<SetStateAction<T>>, boolean] {
  // 以 ref 捕捉初始值，避免 exhaustive-deps 警告（這些值在 mount 後不應改變）
  const keyRef = useRef(key);
  const defaultValueRef = useRef(defaultValue);
  const transformRef = useRef(options?.transform);

  const [value, setValue] = useState<T>(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // 初始化：讀取 localStorage（useEffect 保證 client-only，避免 SSR hydration mismatch）
  // startTransition 標記為低優先更新，避免阻塞用戶輸入等高優先渲染
  useEffect(() => {
    const stored = localStorage.getItem(keyRef.current);
    let nextValue: T;
    if (stored !== null) {
      try {
        nextValue = parseStoredValue<T>(stored, transformRef.current);
      } catch (e) {
        console.error(`[useLocalStorage] "${keyRef.current}" 資料損壞，清除並回復預設值：`, e);
        localStorage.removeItem(keyRef.current);
        nextValue = defaultValueRef.current;
      }
    } else {
      nextValue = defaultValueRef.current;
    }
    startTransition(() => {
      setValue(nextValue);
      setIsLoaded(true);
    });
  }, []);

  // 同步到 localStorage（isLoaded 確保不覆蓋初始讀取）
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(keyRef.current, JSON.stringify(value));
    }
  }, [value, isLoaded]);

  return [value, setValue, isLoaded];
}
