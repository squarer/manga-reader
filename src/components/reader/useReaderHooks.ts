'use client';

/**
 * Reader 自定義 hooks
 */

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import { DEFAULT_SETTINGS, TOOLBAR_HIDE_DELAY } from './types';

/** 觸發翻頁的水平滑動閾值（px） */
const SWIPE_THRESHOLD = 50;
/** 忽略邊緣觸控區域（避免與瀏覽器返回手勢衝突） */
const SWIPE_EDGE_MARGIN = 20;
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

/**
 * 觸控滑動翻頁 hook（僅用於單頁模式）
 *
 * - 水平滑動超過 50px 觸發翻頁
 * - 垂直意圖（|deltaY| > |deltaX| × 1.5）自動略過
 * - 忽略左右邊緣 20px（避免與瀏覽器返回手勢衝突）
 */
export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
}: {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isSwipingRef = useRef(false);
  const currentOffsetRef = useRef(0);
  const onSwipeLeftRef = useRef(onSwipeLeft);
  const onSwipeRightRef = useRef(onSwipeRight);

  useEffect(() => { onSwipeLeftRef.current = onSwipeLeft; }, [onSwipeLeft]);
  useEffect(() => { onSwipeRightRef.current = onSwipeRight; }, [onSwipeRight]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function handleTouchStart(e: TouchEvent) {
      const touch = e.touches[0];
      startXRef.current = touch.clientX;
      startYRef.current = touch.clientY;
      isSwipingRef.current = false;
      currentOffsetRef.current = 0;
    }

    function handleTouchMove(e: TouchEvent) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - startXRef.current;
      const deltaY = touch.clientY - startYRef.current;

      // 垂直意圖偵測：傾斜角偏垂直時略過
      if (!isSwipingRef.current && Math.abs(deltaY) > Math.abs(deltaX) * 1.5) {
        return;
      }

      // 邊緣保護：忽略觸控起點在螢幕邊緣的滑動（瀏覽器返回手勢）
      if (
        startXRef.current < SWIPE_EDGE_MARGIN ||
        startXRef.current > window.innerWidth - SWIPE_EDGE_MARGIN
      ) {
        return;
      }

      isSwipingRef.current = true;
      e.preventDefault();
      currentOffsetRef.current = deltaX;
      setSwipeOffset(deltaX);
    }

    function handleTouchEnd() {
      if (!isSwipingRef.current) return;

      const offset = currentOffsetRef.current;
      if (offset <= -SWIPE_THRESHOLD) {
        onSwipeLeftRef.current();
      } else if (offset >= SWIPE_THRESHOLD) {
        onSwipeRightRef.current();
      }

      isSwipingRef.current = false;
      currentOffsetRef.current = 0;
      setSwipeOffset(0);
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });
    el.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  return { containerRef, swipeOffset };
}
