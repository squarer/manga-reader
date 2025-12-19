"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

/**
 * 雪花粒子介面
 */
interface Snowflake {
  x: number;
  y: number;
  radius: number;
  speed: number;
  opacity: number;
  /** 水平飄動的相位 */
  wobble: number;
  /** 飄動速度 */
  wobbleSpeed: number;
}

/**
 * 下雪粒子特效元件
 * 在背景顯示淡淡的飄雪效果
 */
export function SnowEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snowflakesRef = useRef<Snowflake[]>([]);
  const animationFrameRef = useRef<number>(0);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SNOWFLAKE_COUNT = 300;

    /**
     * 從 CSS 變數取得 primary 色的 RGB 值
     */
    const getPrimaryColor = (): string => {
      const temp = document.createElement("div");
      temp.style.color = "var(--primary)";
      document.body.appendChild(temp);
      const computed = getComputedStyle(temp).color;
      document.body.removeChild(temp);
      // 解析 rgb(r, g, b) 格式
      const match = computed.match(/(\d+),\s*(\d+),\s*(\d+)/);
      return match ? `${match[1]}, ${match[2]}, ${match[3]}` : "218, 165, 32";
    };

    const primaryColor = getPrimaryColor();

    /**
     * 調整 Canvas 尺寸
     */
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    /**
     * 建立雪花粒子
     */
    const createSnowflake = (atTop = false): Snowflake => ({
      x: Math.random() * canvas.width,
      y: atTop ? -10 : Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      speed: Math.random() * 0.5 + 0.3,
      opacity: Math.random() * 0.3 + 0.1,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.02 + 0.01,
    });

    /**
     * 初始化雪花
     */
    const initSnowflakes = () => {
      snowflakesRef.current = Array.from({ length: SNOWFLAKE_COUNT }, () =>
        createSnowflake(false)
      );
    };

    /**
     * 繪製與更新雪花
     */
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      snowflakesRef.current.forEach((flake, index) => {
        // 更新位置
        flake.wobble += flake.wobbleSpeed;
        flake.x += Math.sin(flake.wobble) * 0.5;
        flake.y += flake.speed;

        // 超出畫面則重置到頂部
        if (flake.y > canvas.height + 10) {
          snowflakesRef.current[index] = createSnowflake(true);
        }

        // 繪製雪花（dark: 白色, light: primary 色）
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        const color = resolvedTheme === "dark" ? "255, 255, 255" : primaryColor;
        ctx.fillStyle = `rgba(${color}, ${flake.opacity})`;
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    resize();
    initSnowflakes();
    animate();

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
