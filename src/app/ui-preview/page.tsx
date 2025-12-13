export const metadata = {
  title: 'UI Preview | OneLP',
  description: 'Static preview to iterate on styles without backend',
}

const cards = [
  { title: 'NAV', value: '$12.4M', helper: '↑ 2.1% vs last month' },
  { title: 'Commitment', value: '$18.0M', helper: '62% called' },
  { title: 'TVPI', value: '1.48x', helper: 'Net of fees' },
  { title: 'Capital Calls', value: '$1.2M', helper: 'Due next 30 days' },
]

const pills = ['Private Equity', 'Real Assets', 'Venture', 'Credit', 'Secondaries']

export default function UIPreviewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="mx-auto w-full max-w-6xl px-6 py-14 space-y-12">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">UI preview</p>
            <h1 className="text-4xl font-semibold">OneLP Experience</h1>
            <p className="text-slate-400 max-w-2xl">
              A static page to iterate on typography, color, spacing, and motion without needing backend data.
            </p>
          </div>
          <div className="flex gap-3">
            <button className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition">
              Secondary
            </button>
            <button className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-blue-500/20">
              Primary
            </button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/20 backdrop-blur"
            >
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{card.title}</p>
              <p className="mt-2 text-3xl font-semibold">{card.value}</p>
              <p className="mt-1 text-sm text-slate-400">{card.helper}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/25 backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Performance</p>
                <h2 className="text-2xl font-semibold mt-1">Growth Trajectory</h2>
              </div>
              <div className="flex gap-2 text-xs text-slate-400">
                <span className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">NAV</span>
                <span className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">Distributions</span>
                <span className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1">Calls</span>
              </div>
            </div>
            <div className="mt-6 h-56 rounded-2xl bg-gradient-to-b from-blue-500/10 via-cyan-400/5 to-transparent border border-white/5" />
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur shadow-lg shadow-black/20">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Allocation</p>
              <h3 className="mt-1 text-xl font-semibold">Exposure by Strategy</h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {pills.map((pill) => (
                  <span
                    key={pill}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-500/20 via-teal-400/10 to-blue-500/10 p-5 backdrop-blur shadow-lg shadow-black/20">
              <p className="text-xs uppercase tracking-[0.16em] text-emerald-200/80">Copilot</p>
              <h3 className="mt-1 text-xl font-semibold text-white">Actionable Suggestions</h3>
              <p className="mt-2 text-sm text-emerald-50/80">
                Keep iterating on CTA, hover states, and gradients here—no backend required.
              </p>
              <div className="mt-4 flex gap-2">
                <button className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 transition">
                  Try prompt
                </button>
                <button className="rounded-xl bg-white text-slate-900 px-4 py-2 text-sm font-semibold shadow-md hover:shadow-lg transition">
                  Open AI drawer
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/25 backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Typography</p>
              <h3 className="text-2xl font-semibold">Headings & Body</h3>
            </div>
            <div className="flex gap-2 text-xs text-slate-300">
              <span className="rounded-full bg-white/10 px-3 py-1">H1</span>
              <span className="rounded-full bg-white/10 px-3 py-1">H2</span>
              <span className="rounded-full bg-white/10 px-3 py-1">Body</span>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <h1 className="text-4xl font-semibold text-white">Bold, intentional heading</h1>
            <h2 className="text-2xl font-semibold text-white/90">Secondary headline for context</h2>
            <p className="text-slate-300 leading-relaxed">
              Use this area to validate spacing, line height, and color contrast for body text. Because this page is static,
              you can rapidly adjust Tailwind tokens and see changes without waiting on backend calls.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}

