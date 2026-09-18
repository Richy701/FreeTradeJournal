import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Shared layout for long-form reading pages (legal).
//   - An "On this page" list sits directly to the left of the text on desktop
//     and the pair is centred, the same arrangement as the Documentation page.
//   - Text fills its 42rem column at 17px so paragraphs, headings and section
//     dividers all end on the same edge: about 85 characters per line.
//   - READING_MEASURE is the tighter ~75 character cap (50-75 is the most
//     readable range, 80 the WCAG 1.4.8 ceiling) for text that sits inside a
//     wider layout. Measured with e2e/harness/content-width-audit.mjs.

export const READING_MEASURE = 'max-w-[50ch]'

function slugify(title: string) {
  return title.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function ReadingPage({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      {/* Section list directly beside the text, the pair centred: the same
          arrangement as the Documentation page. */}
      <div className="lg:grid lg:grid-cols-[12rem_minmax(0,42rem)] lg:justify-center lg:gap-16">
        <OnThisPage />
        <div className="min-w-0">
          <div className="mb-10">{header}</div>
          <div data-reading-body className="divide-y divide-border text-[17px] leading-relaxed text-muted-foreground">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ReadingSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section id={slugify(title)} data-reading-section={title} className="scroll-mt-24 py-8 first:pt-0">
      <h2 className="mb-3 text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  )
}

function OnThisPage() {
  const [sections, setSections] = useState<{ id: string; title: string }[]>([])
  const [active, setActive] = useState<string>()

  useEffect(() => {
    const nodes = [...document.querySelectorAll<HTMLElement>('[data-reading-section]')]
    setSections(nodes.map((node) => ({ id: node.id, title: node.dataset.readingSection ?? '' })))
    if (!nodes.length) return
    setActive(nodes[0].id)
    // The section whose heading most recently passed the top of the viewport.
    const onScroll = () => {
      const current = nodes.filter((node) => node.getBoundingClientRect().top <= 120).pop()
      setActive((current ?? nodes[0]).id)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (sections.length < 3) return <div className="hidden lg:block" />

  return (
    <nav aria-label="On this page" className="hidden lg:block">
      <div className="sticky top-24">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">On this page</p>
        <ul className="space-y-2 text-sm">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={active === section.id ? 'true' : undefined}
                className={cn(
                  'block leading-snug transition-colors hover:text-foreground',
                  active === section.id ? 'font-medium text-foreground' : 'text-muted-foreground',
                )}
              >
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}
