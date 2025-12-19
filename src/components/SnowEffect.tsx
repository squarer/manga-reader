"use client";

import { useEffect, useRef } from "react";

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SNOWFLAKE_COUNT = 300;

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

        // 繪製雪花
        ctx.beginPath();
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${flake.opacity})`;
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
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
