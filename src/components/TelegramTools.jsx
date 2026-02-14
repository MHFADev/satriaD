import React, { useMemo, useState } from 'react'

const DEFAULT_CATEGORY = 'Graphic Design'

export default function TelegramTools() {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(DEFAULT_CATEGORY)
  const [description, setDescription] = useState('')

  const template = useMemo(() => {
    const safeTitle = (title || '').trim().replace(/\s+/g, ' ')
    const safeCategory = (category || '').trim().replace(/\s+/g, ' ')
    const safeDesc = (description || '').trim().replace(/\s+/g, ' ')

    if (!safeTitle || !safeCategory) return ''

    return `/upload ${safeTitle} | ${safeCategory} | ${safeDesc}`.trim()
  }, [title, category, description])

  const copy = async () => {
    if (!template) return
    await navigator.clipboard.writeText(template)
  }

  return (
    <div className="min-h-screen bg-brutal-bg p-6">
      <div className="max-w-3xl mx-auto bg-white border-3 border-black shadow-brutal-xl p-6">
        <h1 className="text-3xl md:text-4xl font-black uppercase">Telegram Bot Tools</h1>
        <p className="mt-2 font-bold">
          Isi form ini, lalu copy template dan paste ke Telegram saat mengirim foto.
        </p>

        <div className="mt-8 grid gap-6">
          <div>
            <label className="block font-black uppercase mb-2">Judul</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-3 border-black p-3 font-bold outline-none shadow-brutal focus:shadow-none focus:translate-x-1 focus:translate-y-1 transition-all"
              placeholder="Contoh: Logo Satria Studio"
            />
          </div>

          <div>
            <label className="block font-black uppercase mb-2">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border-3 border-black p-3 font-bold outline-none shadow-brutal focus:shadow-none focus:translate-x-1 focus:translate-y-1 transition-all"
            >
              <option>Graphic Design</option>
              <option>Logo Design</option>
              <option>Branding</option>
              <option>UI/UX Design</option>
              <option>Web Development</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block font-black uppercase mb-2">Deskripsi</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border-3 border-black p-3 font-bold outline-none shadow-brutal focus:shadow-none focus:translate-x-1 focus:translate-y-1 transition-all"
              placeholder="Contoh: Logo untuk klien X, style minimalis"
            />
          </div>

          <div>
            <label className="block font-black uppercase mb-2">Template (Copy-Paste)</label>
            <div className="border-3 border-black p-3 font-mono text-sm bg-brutal-bg shadow-brutal">
              {template || 'Isi Judul dan Kategori dulu untuk generate template.'}
            </div>
            <div className="mt-3 flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={copy}
                disabled={!template}
                className="neo-brutal-btn bg-brutal-orange text-white px-5 py-3 font-black uppercase disabled:opacity-50"
              >
                Copy Template
              </button>
              <a
                href="/admin"
                className="neo-brutal-btn bg-black text-white px-5 py-3 font-black uppercase"
              >
                Buka Admin Panel
              </a>
            </div>
          </div>

          <div className="border-3 border-black p-4 bg-white">
            <h2 className="font-black uppercase">Cara Pakai (Paling Mudah)</h2>
            <div className="mt-2 font-bold">
              1) Jalankan bot di laptop/VPS: <span className="font-mono">node server/bot_telegram.js</span>
              <br />
              2) Di Telegram: buka bot, klik <span className="font-black">Start</span>
              <br />
              3) Kirim foto + paste template di caption
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
