import { useState } from 'react'
import { profile } from '../data'

export default function Contact() {
  const [copied, setCopied] = useState(false)

  const copyWechat = async () => {
    try {
      await navigator.clipboard.writeText(profile.wechat)
    } catch {
      // 旧浏览器降级
      const ta = document.createElement('textarea')
      ta.value = profile.wechat
      document.body.appendChild(ta)
      ta.select()
      try { document.execCommand('copy') } catch {}
      ta.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const items = [
    { k: 'Email', v: profile.email, href: `mailto:${profile.email}` },
    { k: 'Phone', v: profile.phone, href: `tel:${profile.phone}` },
    { k: 'Wechat', v: profile.wechat, href: null, onClick: copyWechat },
  ]

  return (
    <section className="contact" id="contact">
      <div className="contact-glow" />

      <div className="container contact-inner">
        <div className="reveal">
          <div className="sec-label">
            <span className="idx">04</span>
            <span className="bar" />
            <span className="mono">Get In Touch</span>
          </div>

          <h2 className="contact-title">
            LET&apos;S BUILD
            <br />
            <em>SOMETHING</em>
          </h2>

          <a className="contact-mail" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>

          <div className="contact-grid">
            {items.map((it) => {
              // Wechat：可点击的按钮（非 href），点击复制 + 显示反馈
              if (it.onClick) {
                return (
                  <button
                    type="button"
                    className={`citem citem-action ${copied ? 'is-copied' : ''}`}
                    key={it.k}
                    onClick={it.onClick}
                    aria-label={`复制微信号 ${it.v}`}
                  >
                    <div className="k">
                      {it.k}
                      <span className="hint">{copied ? 'Copied ✓' : 'Click to copy'}</span>
                    </div>
                    <div className="v">{it.v}</div>
                  </button>
                )
              }
              // Email / Phone：原生链接
              if (it.href) {
                return (
                  <a className="citem citem-action" key={it.k} href={it.href}>
                    <div className="k">{it.k}</div>
                    <div className="v">{it.v}</div>
                  </a>
                )
              }
              return null
            })}
          </div>
        </div>
      </div>

      <footer className="footer">
        <div className="container footer-inner">
          <span>© {new Date().getFullYear()} {profile.nameEn} — {profile.roles.join(' / ')}</span>
          <span>{profile.location}</span>
        </div>
      </footer>
    </section>
  )
}
