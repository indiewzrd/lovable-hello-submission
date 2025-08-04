import { HeroSection } from "./(public)/(landing)/_components/sections/hero-section"
import { FeaturesSection } from "./(public)/(landing)/_components/sections/features-section"
import { CTASection } from "./(public)/(landing)/_components/sections/cta-section"
import { SectionWrapper } from "./(public)/(landing)/_components/sections/section-wrapper"
import { Header } from "./(public)/(landing)/_components/header"

export default function RootPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <SectionWrapper>
          <HeroSection />
        </SectionWrapper>
        <SectionWrapper>
          <FeaturesSection />
        </SectionWrapper>
        <SectionWrapper>
          <CTASection />
        </SectionWrapper>
      </main>
    </>
  )
}