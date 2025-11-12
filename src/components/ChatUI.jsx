import { useEffect, useRef, useState } from 'react'
import Spline from '@splinetool/react-spline'

const BACKEND = import.meta.env.VITE_BACKEND_URL || ''

function GradientButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="relative inline-flex items-center gap-2 rounded-xl px-4 py-2 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/20"
      style={{
        background:
          'linear-gradient(135deg, rgba(123,59,255,1) 0%, rgba(55,111,255,1) 35%, rgba(255,94,58,1) 100%)',
      }}
    >
      {children}
    </button>
  )
}

export default function ChatUI() {
  const [urls, setUrls] = useState('')
  const [ingesting, setIngesting] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! Add one or more website URLs, then ask me anything based on those resources.' },
  ])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [sources, setSources] = useState([])
  const listRef = useRef(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const parseUrls = () =>
    urls
      .split(/\s|,|\n/)
      .map((u) => u.trim())
      .filter((u) => u)

  const handleIngest = async () => {
    const list = parseUrls()
    if (!list.length) return
    setIngesting(true)
    try {
      for (const u of list) {
        await fetch(`${BACKEND}/ingest`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: u }),
        })
      }
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'Ingestion complete. Ask your question!' },
      ])
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'Failed to ingest one of the URLs. Please verify and try again.' },
      ])
    } finally {
      setIngesting(false)
    }
  }

  const ask = async () => {
    if (!question.trim()) return
    const list = parseUrls()
    setLoading(true)
    setMessages((m) => [...m, { role: 'user', content: question }])
    setQuestion('')
    try {
      const res = await fetch(`${BACKEND}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, urls: list.length ? list : undefined }),
      })
      if (!res.ok) throw new Error('Request failed')
      const data = await res.json()
      setMessages((m) => [...m, { role: 'assistant', content: data.answer }])
      setSources(data.sources || [])
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'Sorry, something went wrong while answering.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0d021f] via-[#0a0630] to-[#020617] text-white">
      {/* Hero with Spline */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="pointer-events-none select-none">
            <Spline scene="https://prod.spline.design/4cHQr84zOGAHOehh/scene.splinecode" />
          </div>
        </div>
        <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs md:text-sm bg-white/10 ring-1 ring-white/15 backdrop-blur">
            <span>AI Docs & Website Chatbot</span>
          </div>
          <h1 className="mt-5 text-3xl md:text-5xl font-semibold tracking-tight">
            Ask anything from your resources
          </h1>
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">
            Provide URLs to websites or docs. I’ll read them, understand key points, and answer with citations.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto] max-w-3xl mx-auto">
            <input
              className="w-full rounded-xl bg-white/10 ring-1 ring-white/15 focus:ring-2 focus:ring-purple-400/60 px-4 py-3 placeholder-white/50 outline-none"
              placeholder="Paste one or more URLs separated by space or comma"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
            />
            <GradientButton onClick={handleIngest} disabled={ingesting}>
              {ingesting ? 'Ingesting…' : 'Add resources'}
            </GradientButton>
          </div>
        </div>
      </div>

      {/* Chat Section */}
      <div className="relative">
        {/* gradient aura background */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[420px] w-[420px] rounded-full blur-3xl opacity-40"
             style={{ background: 'radial-gradient(circle at 30% 30%, rgba(131,58,180,0.6), rgba(253,29,29,0.35), rgba(252,176,69,0.25))' }} />
        <div className="max-w-5xl mx-auto px-6 pb-28">
          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur p-4 md:p-6">
            <div ref={listRef} className="h-[360px] overflow-y-auto pr-2 space-y-4">
              {messages.map((m, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className={`shrink-0 h-8 w-8 rounded-full ${m.role === 'assistant' ? 'bg-gradient-to-tr from-purple-500 via-blue-500 to-orange-400' : 'bg-white/10'}`} />
                  <div className="prose prose-invert max-w-none">
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                className="w-full rounded-xl bg-white/10 ring-1 ring-white/15 focus:ring-2 focus:ring-blue-400/60 px-4 py-3 placeholder-white/50 outline-none"
                placeholder="Ask your question…"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && ask()}
              />
              <GradientButton onClick={ask} disabled={loading}>
                {loading ? 'Thinking…' : 'Ask'}
              </GradientButton>
            </div>
            {sources.length > 0 && (
              <div className="mt-6 border-t border-white/10 pt-4">
                <p className="text-sm text-white/70 mb-2">Sources</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  {sources.map((s, i) => (
                    <a key={i} href={s.url} target="_blank" rel="noreferrer"
                       className="rounded-lg p-3 bg-white/5 ring-1 ring-white/10 hover:ring-white/20 transition">
                      <div className="text-sm font-medium line-clamp-1">{s.title || s.url}</div>
                      <div className="text-xs text-white/60 mt-1">chunk #{s.chunk_index} • score {s.score}</div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-10 text-center text-white/50 text-sm">
        Built with a luminous gradient theme and RAG over your URLs.
      </div>
    </div>
  )
}
