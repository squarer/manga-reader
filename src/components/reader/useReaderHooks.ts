'use client';

/**
 * Reader 自定義 hooks
 */

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import { DEFAULT_SETTINGS, TOOLBAR_HIDE_DELAY } from './types';
import type { ReaderSettings } from './types';

/**
 * 工具列可見性控制 hook
 *
 * 自動在指定時間後隱藏工具列
 */
export function useToolbarVisibility() {
  const [isVisible, setIsVisible] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToolbar = useCallback(() => {
    setIsVisible(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, TOOLBAR_HIDE_DELAY);
  }, []);

  const hideToolbar = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  }, []);

  // 初始化時設定隱藏計時器
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, TOOLBAR_HIDE_DELAY);
    return () => clearTimeout(timer);
  }, []);

  return { isVisible, showToolbar, hideToolbar };
}

/**
 * 全螢幕控制 hook
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  return { isFullscreen, toggleFullscreen };
}

/** localStorage key */
const STORAGE_KEY = 'reader-settings';

/** 快取的設定值 */
let cachedSettings: ReaderSettings = DEFAULT_SETTINGS;

/** 從 localStorage 讀取並更新快取 */
function loadSettings(): ReaderSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    cachedSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } else {
    cachedSettings = DEFAULT_SETTINGS;
  }
  return cachedSettings;
}

// 初始化快取
if (typeof window !== 'undefined') {
  loadSettings();
}

/** 事件監聽器列表 */
const listeners = new Set<() => void>();

/** 訂閱 localStorage 變更 */
function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** 取得當前快照（回傳快取的參照） */
function getSnapshot(): ReaderSettings {
  return cachedSettings;
}

/** SSR 快照 */
function getServerSnapshot(): ReaderSettings {
  return DEFAULT_SETTINGS;
}

/**
 * 閱讀器設定 hook
 *
 * 使用 useSyncExternalStore 從 localStorage 讀取並同步設定
 */
export function useReaderSettings() {
  const settings = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const updateSettings = useCallback((updates: Partial<ReaderSettings>) => {
    const next = { ...cachedSettings, ...updates };
    cachedSettings = next;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    // 通知所有訂閱者
    listeners.forEach((listener) => listener());
  }, []);

  return { settings, updateSettings };
}
