import { useEffect, useRef } from 'react'
import { profile } from '../data'

export default function Hero() {
  const [l1, l2] = profile.heroTitleLines
  const videoRef = useRef(null)

  // 移动端自动播放：iOS/安卓/微信内置浏览器要求 <video> 必须带 muted 属性才允许自动播放，
  // 而 React 的 muted prop 不一定会渲染成 DOM 属性——导致移动端判定为"非静音"而禁止自动播放，
  // 又因为没有 poster，播放失败就是黑/透明，看起来像"视频消失了"。
  // 这里用 ref 强制 muted 属性 + 主动 play() + 微信 JSBridge 触发 + 首触兜底，并配 poster 首帧。
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = true
    v.defaultMuted = true
    v.playsInline = true
    v.setAttribute('muted', '')

    const tryPlay = () => {
      const p = v.play()
      if (p && typeof p.catch === 'function') p.catch(() => {})
    }

    tryPlay()
    v.addEventListener('canplay', tryPlay, { once: true })

    // 微信内置浏览器：通过 WeixinJSBridge.invoke('getNetworkType') 触发播放上下文
    const wxPlay = () => {
      if (typeof window.WeixinJSBridge !== 'undefined') {
        window.WeixinJSBridge.invoke('getNetworkType', {}, tryPlay)
      }
    }
    if (typeof window.WeixinJSBridge !== 'undefined') {
      wxPlay()
    } else {
      document.addEventListener('WeixinJSBridgeReady', wxPlay, false)
    }

    // 兜底：用户第一次触摸/点击时再尝试播放
    const onInteract = () => tryPlay()
    window.addEventListener('touchstart', onInteract, { once: true, passive: true })
    window.addEventListener('click', onInteract, { once: true })

    return () => {
      v.removeEventListener('canplay', tryPlay)
      document.removeEventListener('WeixinJSBridgeReady', wxPlay)
      window.removeEventListener('touchstart', onInteract)
      window.removeEventListener('click', onInteract)
    }
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
        volume={0}
        controlsList="nodownload nofullscreen"
        {...{
          'x5-video-player-type': 'h5',
          'x5-video-player-fullscreen': 'false',
          'x5-video-orientation': 'portrait',
          'x5-playsinline': 'true',
          'webkit-playsinline': 'true'
        }}
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
