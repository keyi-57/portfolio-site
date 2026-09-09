import { useEffect, useState } from 'react'

/**
 * 滚动进入视口时给 .reveal 元素加 is-in 类
 *
 * 三个健壮性处理（都是踩过的坑）：
 * 1. threshold 用 0 + 负 rootMargin，而不是 0.12。
 *    区块高的元素（作品区有 3500px+）在小视口里永远达不到 12% 可见比，
 *    会一直卡在 opacity:0 —— 表现就是"点进去一片空白"。
 * 2. 观察器建立前先同步扫一遍：已经在视口内 / 已经滚过去的元素直接点亮，
 *    避免刷新时浏览器恢复滚动位置，上方的元素却还是透明的。
 * 3. 兜底定时器 + scroll 复检：万一 IO 因任何原因没回调，
 *    3 秒后无条件点亮所有"已经滚过"的元素。宁可没有动画，也不能没有内容。
 */
export function useReveal(deps = []) {
  useEffect(() => {
    const inViewNow = el => {
      const r = el.getBoundingClientRect()
      // 顶部已进入视口下方边界（含已经滚过去的）
      return r.top < window.innerHeight - 40 && r.bottom > -200
    }
    const lightUp = el => {
      el.classList.add('is-in')
      return true
    }

    let io = null
    const observed = new Set()

    const setup = () => {
      const els = Array.from(document.querySelectorAll('.reveal:not(.is-in)'))
      if (!els.length) return

      // (2) 先同步点亮已经在视口里的，再交给 IO 处理剩下的
      const pending = els.filter(el => !inViewNow(el) || !lightUp(el))

      if (!pending.length) return

      io = new IntersectionObserver(
        entries => {
          entries.forEach(e => {
            if (e.isIntersecting) {
              e.target.classList.add('is-in')
              io.unobserve(e.target)
              observed.delete(e.target)
            }
          })
        },
        // (1) threshold 0：只要露出一个像素就触发
        { threshold: 0, rootMargin: '0px 0px -40px 0px' }
      )
      pending.forEach(el => {
        io.observe(el)
        observed.add(el)
      })
    }

    setup()

    // (3) 兜底：3s 后无条件点亮所有仍在视口上方（已滚过）却还没点亮的元素
    const rescue = () => {
      document.querySelectorAll('.reveal:not(.is-in)').forEach(el => {
        if (inViewNow(el)) lightUp(el)
      })
    }
    const t1 = setTimeout(rescue, 3000)
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        rescue()
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      clearTimeout(t1)
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      // 只 disconnect 本轮创建的观察器；元素上的 is-in 类保留（不做退场动画）
      if (io) io.disconnect()
      observed.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/** 监听页面滚动，返回是否已滚动过阈值 */
export function useScrolled(threshold = 24) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // 性能：用闭包变量记住上一次的值，只有真正跨过阈值才 setState。
    // 否则每帧滚动事件都会进一次 React 的调度流程。
    let prev = null
    let raf = 0

    const read = () => {
      raf = 0
      const next = window.scrollY > threshold
      if (next !== prev) {
        prev = next
        setScrolled(next)
      }
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read)
    }

    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [threshold])

  return scrolled
}
