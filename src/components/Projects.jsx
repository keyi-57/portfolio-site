import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from 'react'
import { projects } from '../data'

// 从数据动态生成筛选类目（去重 + 保留顺序）—— 少维护成本
const useCategories = () =>
  useMemo(() => ['全部', ...Array.from(new Set(projects.map((p) => p.category)))], [])

/**
 * 视频卡片：进入视口才 autoplay，离开暂停。
 * 性能权衡：3-4 个 <video> 同时解码对中端机仍有压力，
 * 把解码控制在"用户看得到的那张卡"上是最简单的优化。
 */
function useVideoAutoplayInView(rootRef) {
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          const v = e.target.querySelector('video')
          if (!v) return
          if (e.isIntersecting && e.intersectionRatio > 0.4) {
            v.play().catch(() => {})
          } else {
            v.pause()
          }
        })
      },
      { threshold: [0, 0.4, 0.8] }
    )
    root.querySelectorAll('.pcard-media').forEach(el => {
      if (el.querySelector('video')) io.observe(el)
    })
    return () => io.disconnect()
  }, [rootRef])
}

export default function Projects() {
  const categories = useCategories()
  const [active, setActive] = useState('全部')
  const [selected, setSelected] = useState(null)
  const gridRef = useRef(null)

  useVideoAutoplayInView(gridRef)

  const filtered = active === '全部' ? projects : projects.filter((p) => p.category === active)

  useLayoutEffect(() => {
    const cards = gridRef.current?.querySelectorAll('.pcard.reveal')
    if (!cards || !cards.length) return
    cards.forEach((el) => el.classList.add('is-in'))
  }, [active])

  // ESC 关闭弹窗
  useEffect(() => {
    if (!selected) return
    const onKey = (e) => {
      if (e.key === 'Escape') setSelected(null)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [selected])

  return (
    <section className="projects" id="projects">
      <div className="container">
        <div className="projects-head reveal">
          <div>
            <div className="sec-label">
              <span className="idx">02</span>
              <span className="bar" />
              <span className="mono">Selected Works</span>
            </div>
            <h2 className="sec-title">精选项目</h2>
          </div>
          <p className="sec-desc">
            AIGC 影像、概念设计与动态影像的实践记录。每一张都在测试同一件事——
            如何让机器生成的画面，仍然带有人的判断。
          </p>
        </div>

        {/* 筛选条 —— 横向 chip，激活态用下划线 + 黄铜色 */}
        <div className="filter-bar reveal" role="tablist">
          {categories.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={active === c}
              className={`filter-chip ${active === c ? 'is-active' : ''}`}
              onClick={() => setActive(c)}
            >
              {c}
              <span className="filter-count">
                {c === '全部' ? projects.length : projects.filter((p) => p.category === c).length}
              </span>
            </button>
          ))}
        </div>

        <div className="projects-grid" ref={gridRef}>
          {filtered.map((p, i) => (
            <article
              className={`pcard reveal ${p.video ? 'pcard--video' : ''} ${i % 2 === 1 ? 'reveal-delay' : ''}`}
              key={p.id}
              onClick={() => setSelected(p)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelected(p)
                }
              }}
            >
              <div className="pcard-media">
                {p.video ? (
                  <video
                    className="pcard-video"
                    src={p.video}
                    poster={p.image}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    aria-hidden="true"
                  />
                ) : (
                  <img src={p.image} alt={p.title} loading="lazy" />
                )}

                <span className="idx">{p.id}</span>
                <span className="year">{p.year}</span>
                {p.video && <span className="video-badge">▶ VIDEO</span>}

                <span className="crop crop-tl" />
                <span className="crop crop-tr" />
                <span className="crop crop-bl" />
                <span className="crop crop-br" />
                <span className="scanline" />
                <span className="view-badge">VIEW ↗</span>

                <div className="ov">
                  <p>{p.desc}</p>
                </div>
              </div>

              <div className="pcard-foot">
                <div>
                  <h3 className="pcard-title">
                    {p.title}
                    {p.subtitle && <span className="pcard-subtitle"> · {p.subtitle}</span>}
                  </h3>
                  <div className="pcard-tags">
                    {p.tags.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                </div>
                <div className="pcard-cat">{p.category}</div>
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="projects-empty">该分类暂无作品</div>
        )}
      </div>

      {/* 详情弹窗 */}
      {selected && (
        <div
          className="modal-overlay"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-label={selected.title}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setSelected(null)}
              aria-label="关闭"
            >
              ×
            </button>

            <div className="modal-image">
              {selected.video ? (
                <video
                  className="modal-video"
                  src={selected.video}
                  poster={selected.image}
                  controls
                  autoPlay
                  loop
                  playsInline
                  preload="auto"
                />
              ) : (
                <img src={selected.image} alt={selected.title} />
              )}
            </div>

            <div className="modal-body">
              <div className="modal-meta">
                <span className="modal-idx">{selected.id}</span>
                <span className="modal-cat">{selected.category}</span>
                <span className="modal-year">{selected.year}</span>
              </div>
              <h3 className="modal-title">
                {selected.title}
                {selected.subtitle && <span className="modal-subtitle"> · {selected.subtitle}</span>}
              </h3>
              <p className="modal-desc">{selected.desc}</p>
              {selected.role && <p className="modal-role">{selected.role}</p>}
              <div className="modal-tags">
                {selected.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
