import Nav from './components/Nav'
import Hero from './components/Hero'
import About from './components/About'
import Projects from './components/Projects'
import Strengths from './components/Strengths'
import Contact from './components/Contact'
import GradientWaves from './components/GradientWaves'
import { useReveal } from './hooks/useReveal'
import { useSpotlight } from './hooks/useSpotlight'

export default function App() {
  useReveal()
  useSpotlight()

  return (
    <>
      {/* 全局动态背景：近单色冷调波浪，铺满视口固定在最底层。
          刻意压成低饱和石墨蓝——它是"质感纹理"，不能与黄铜强调色抢色相。 */}
      <div className="bg-waves">
        <GradientWaves
          horizonColor="#0a0a12"
          waveColor="#1b1b28"
          crestColor="#4a5266"
          speed={0.12}
          amplitude={2.2}
          waveScale={0.55}
          waveRatio={0.9}
          swell={35}
          turbulence={20}
          tilt={1.05}
          zoom={1.0}
          height={5.5}
          fogDepth={15}
          detail="medium"
          brightness={0.85}
          opacity={0.62}
          mouseInteraction={true}
          parallaxStrength={0.75}
          grain={true}
          grainIntensity={0.035}
        />
      </div>

      <Nav />
      <Hero />

      {/* 服务标签跑马灯：Hero 与 About 之间的过渡带。
          参考站的"生动"来自背景 canvas 实时绘制；这里用一条持续滚动的文字条
          提供恒定运动感——鼠标悬停可暂停（暗示"这是可控的"） */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          <span>AIGC IMAGERY · BRAND VISUAL · MOTION EDIT · CONCEPT ART · CHARACTER DESIGN · CINEMATIC LIGHTING · </span>
          <span>AIGC IMAGERY · BRAND VISUAL · MOTION EDIT · CONCEPT ART · CHARACTER DESIGN · CINEMATIC LIGHTING · </span>
        </div>
      </div>

      <main>
        <About />
        <Projects />
        <Strengths />
      </main>
      <Contact />
    </>
  )
}
