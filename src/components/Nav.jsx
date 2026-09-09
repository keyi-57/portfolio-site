import { navItems, profile } from '../data'
import { useScrolled } from '../hooks/useReveal'

export default function Nav() {
  const scrolled = useScrolled(24)

  return (
    <nav className={`nav ${scrolled ? 'is-stuck' : ''}`}>
      <div className="nav-inner">
        <a href="#top" className="nav-brand">
          <span className="nav-dot" />
          <span>{profile.nameEn}</span>
        </a>

        <div className="nav-menu">
          {navItems.map((it) => (
            <a key={it.id} href={`#${it.id}`}>
              <span className="n">{it.index}</span>
              <span>{it.label}</span>
            </a>
          ))}
        </div>

        <a href="#contact" className="nav-cta">
          <span className="dot" />
          <span>联系合作</span>
        </a>
      </div>
    </nav>
  )
}
