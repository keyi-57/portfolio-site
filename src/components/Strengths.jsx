import { strengths } from '../data'

export default function Strengths() {
  return (
    <section className="strengths" id="strengths">
      <div className="container">
        <div className="reveal">
          <div className="sec-label">
            <span className="idx">03</span>
            <span className="bar" />
            <span className="mono">Capabilities</span>
          </div>
          <h2 className="sec-title">个人优势</h2>
          <p className="sec-desc">
            设计与工程的交叉地带，是我真正能创造价值的地方——
            不只是把图做出来，而是让它可被复现、可被落地、可被规模化。
          </p>
        </div>

        <div className="strengths-grid reveal">
          {strengths.map((s) => (
            <div className="scard spotlight-card" key={s.id}>
              <div className="scard-idx">{s.id}</div>
              <h3 className="scard-title">{s.title}</h3>
              <p className="scard-desc">{s.desc}</p>
              <div className="scard-keys">
                {s.keywords.map((k) => (
                  <span key={k}>{k}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
