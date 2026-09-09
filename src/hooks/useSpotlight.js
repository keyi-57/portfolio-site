import { useEffect } from 'react'

/**
 * 全局指针跟踪 —— 把光标坐标写入 :root 的 CSS 变量
 * 所有 .spotlight-card 通过 var(--x) / var(--y) 读取，实现光晕跟随
 *
 * 相比原组件（每个卡片各自 addEventListener）的优势：
 *   1. 全局只挂 1 个监听器，卡片再多也不增加开销
 *   2. rAF 节流，pointermove 高频触发不会掉帧
 */
export function useSpotlight() {
  useEffect(() => {
    const root = document.documentElement
    let raf = 0
    let x = window.innerWidth / 2
    let y = window.innerHeight / 2

    const flush = () => {
      root.style.setProperty('--x', x.toFixed(2))
      root.style.setProperty('--y', y.toFixed(2))
      root.style.setProperty('--xp', (x / window.innerWidth).toFixed(2))
      root.style.setProperty('--yp', (y / window.innerHeight).toFixed(2))
      raf = 0
    }

    const onMove = (e) => {
      x = e.clientX
      y = e.clientY
      if (!raf) raf = requestAnimationFrame(flush)
    }

    // 初始给个居中值，避免首帧变量未定义
    flush()
    document.addEventListener('pointermove', onMove, { passive: true })

    return () => {
      document.removeEventListener('pointermove', onMove)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
}
