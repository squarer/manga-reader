'use client';

/**
 * Reader 自定義 hooks
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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

/**
 * 取得初始設定
 *
 * 從 localStorage 讀取，若無則使用預設值
 */
function getInitialSettings(): ReaderSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }
  const saved = localStorage.getItem('reader-settings');
  if (saved) {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  }
  return DEFAULT_SETTINGS;
}

/**
 * 閱讀器設定 hook
 *
 * 自動同步設定至 localStorage
 */
export function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettings>(getInitialSettings);

  const updateSettings = useCallback((updates: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('reader-settings', JSON.stringify(next));
      return next;
    });
  }, []);

  return { settings, updateSettings };
}
