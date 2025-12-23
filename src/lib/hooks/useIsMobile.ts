import { useState, useEffect } from 'react';

/** Mobile 斷點（與 Tailwind sm 一致） */
const MOBILE_BREAKPOINT = 640;

/**
 * 判斷是否為 Mobile 設備
 *
 * 使用 matchMedia 監聽螢幕寬度變化，與 Tailwind `sm:` 斷點一致
 *
 * @returns 是否為 mobile（寬度 < 640px）
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    // 初始化
    handleChange(mql);

    // 監聽變化
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return isMobile;
}
