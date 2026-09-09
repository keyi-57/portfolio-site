import { profile } from '../data'

export default function About() {
  return (
    <section className="about" id="about">
      <div className="container">
        <div className="about-grid">
          {/* 右：介绍 + 短 lead + 数据
              左侧 Design Fingerprint 卡片已删除（与设计师气场不合群）——
              把它压缩成一行更克制的 metadata 串，更符合版式优先级。 */}
          <div className="reveal">
            <div className="sec-label">
              <span className="idx">01</span>
              <span className="bar" />
              <span className="mono">About</span>
            </div>

            <h2 className="sec-title">
              把代码的结构感
              <br />
              带进视觉创作
            </h2>

            {/* 短 lead 句：3 段自我介绍压缩为 1 句，承接标题 */}
            <p className="about-lead">{profile.introLead}</p>

            {/* 项目数据 */}
            <div className="about-stats">
              {profile.stats.map((s) => (
                <div className="stat" key={s.label}>
                  <div className="v">{s.value}</div>
                  <div className="l">{s.label}</div>
                  <div className="n">{s.note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 经历时间线 */}
        <div className="timeline reveal">
          <div className="sec-label">
            <span className="idx">01.1</span>
            <span className="bar" />
            <span className="mono">Experience</span>
          </div>
          {profile.timeline.map((t) => (
            <div className="tl-item" key={t.period + t.role}>
              <div className="tl-period">{t.period}</div>
              <div>
                <div className="tl-role">{t.role}</div>
                <div className="tl-org">{t.org}</div>
                <div className="tl-desc">{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
