import { useEffect, useRef } from 'react'
import { profile } from '../data'

export default function Hero() {
  const [l1, l2] = profile.heroTitleLines
  const videoRef = useRef(null)

  // 移动端自动播放：iOS/部分安卓浏览器要求 <video> 必须带 muted 属性才允许自动播放，
  // 而 React 的 muted prop 不一定会渲染成 DOM 属性——导致移动端判定为"非静音"而禁止自动播放，
  // 又因为没有 poster，播放失败就是黑/透明，看起来像"视频消失了"。
  // 这里用 ref 强制 muted 属性 + 主动 play()，并配 poster 兜底首帧。
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = true
    v.defaultMuted = true
    v.playsInline = true
    const tryPlay = () => {
      const p = v.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    }
    tryPlay()
    // 某些浏览器首帧解码完才允许 play，监听 canplay 再补一次
    v.addEventListener('canplay', tryPlay, { once: true })
    return () => v.removeEventListener('canplay', tryPlay)
  }, [])

  return (
    <header className="hero" id="top">
      <video
        ref={videoRef}
        className="hero-video"
        src="/media/hero.mp4"
        poster="/media/hero-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        // Chrome 不支持 <link rel="preload" as="video">，
        // 想让首屏视频优先下载只能靠 fetchpriority
        fetchpriority="high"
        aria-hidden="true"
      />
      <div className="hero-mask" />
      <div className="hero-grain" />

      <div className="hero-inner">
        {/* 顶部：状态 + 元信息 */}
        <div className="hero-top">
          <div className="hero-status">
            <span className="pulse" />
            <span>{profile.status}</span>
          </div>
          <div className="hero-meta">
            {profile.heroMeta.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>

        {/* 底部：标题 + 支撑信息 + CTA（首屏必须有行动点） */}
        <div className="hero-bottom">
          <div className="hero-headline">
            <p className="hero-eyebrow">{profile.nameEn}</p>
            <h1 className="hero-title">
              {l1}
              <span className="l2">{l2}</span>
            </h1>
          </div>

          <div className="hero-aside">
            <p className="hero-lead">{profile.heroLead}</p>
            <div className="hero-cta">
              <a className="btn btn-primary" href="#projects">
                查看作品
              </a>
              <a className="btn" href="#contact">
                联系我
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-scroll">
        <span>SCROLL</span>
      </div>
    </header>
  )
}
