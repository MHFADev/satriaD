import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send, CheckCircle2, User, MessageSquare } from 'lucide-react'
import emailjs from '@emailjs/browser'

// Konfigurasi API & Discord (gunakan environment variables)
const emailConfig = {
  SERVICE_ID: 'YOUR_SERVICE_ID',
  TEMPLATE_ID: 'YOUR_TEMPLATE_ID',
  PUBLIC_KEY: 'YOUR_PUBLIC_KEY',
  DISCORD_WEBHOOK_URL: import.meta.env.VITE_DISCORD_WEBHOOK_URL || '',
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/orders'
}

const OrderForm = () => {
  const formRef = useRef()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    service: 'desain',
    deadline: '',
    detail: ''
  })

  const sendToDiscord = async (data) => {
    const message = {
      embeds: [{
        title: "🚀 Pesanan Baru - SatriaD",
        color: 0xFF5C00, // Brutal Orange
        fields: [
          { name: "👤 Nama", value: data.name, inline: true },
          { name: "📱 WhatsApp", value: data.whatsapp, inline: true },
          { name: "🛠️ Layanan", value: data.service, inline: true },
          { name: "📅 Deadline", value: data.deadline || "Tidak ada", inline: true },
          { name: "📝 Detail", value: data.detail }
        ],
        timestamp: new Date()
      }]
    }

    try {
      const response = await fetch(emailConfig.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      })
      return response.ok
    } catch (err) {
      console.error("Discord error:", err)
      return false
    }
  }

  const sendToDatabase = async (data) => {
    try {
      const response = await fetch(emailConfig.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      return response.ok
    } catch (err) {
      console.error("Database error:", err)
      return false
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name || !formData.whatsapp || !formData.detail) {
      setError('Tolong isi semua field yang wajib ya! 🙏')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 1. Simpan ke Database (PostgreSQL)
      const dbSaved = await sendToDatabase(formData)
      if (!dbSaved) console.warn("Gagal simpan ke DB, lanjut ke fallback...")

      // 2. EmailJS / Discord Logic
      const isEmailJsConfigured = emailConfig.SERVICE_ID !== 'YOUR_SERVICE_ID'
      
      if (isEmailJsConfigured) {
        await emailjs.sendForm(
          emailConfig.SERVICE_ID,
          emailConfig.TEMPLATE_ID,
          formRef.current,
          emailConfig.PUBLIC_KEY
        )
      } else if (emailConfig.DISCORD_WEBHOOK_URL && emailConfig.DISCORD_WEBHOOK_URL !== '') {
        const discordSent = await sendToDiscord(formData)
        if (!discordSent && !dbSaved) throw new Error('Semua jalur pengiriman gagal')
      } else if (!dbSaved) {
        // Jika semua belum dikonfigurasi
        console.log('Form submitted (Dev Mode):', formData)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      
      setSuccess(true)
      setFormData({
        name: '',
        whatsapp: '',
        service: 'desain',
        deadline: '',
        detail: ''
      })
    } catch (err) {
      setError('Yah, ada error nih. Tapi jangan khawatir, coba hubungi via WhatsApp aja!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="order" className="py-24 px-6 bg-brutal-yellow border-b-3 border-black">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, rotate: -2, y: 50 }}
          whileInView={{ opacity: 1, rotate: 0, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 50, damping: 20 }}
          className="bg-white border-3 border-black p-8 md:p-12 shadow-brutal-xl relative overflow-hidden"
        >
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-brutal-blue -mr-16 -mt-16 rotate-45 border-b-3 border-black" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-10">
              <div className="bg-brutal-orange p-4 border-3 border-black shadow-brutal -rotate-3">
                <Send className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-5xl font-black uppercase tracking-tight">Kirim Pesanan</h2>
            </div>

            {success ? (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-20 bg-brutal-bg border-3 border-black shadow-brutal"
              >
                <div className="inline-block p-6 bg-green-400 border-3 border-black rounded-full mb-6 animate-bounce">
                  <CheckCircle2 size={60} />
                </div>
                <h3 className="text-4xl font-black mb-4 uppercase">Pesanan Terkirim!</h3>
                <p className="text-xl font-bold mb-8">Satria akan segera menghubungimu via WhatsApp. Tunggu ya!</p>
                <button 
                  onClick={() => setSuccess(false)}
                  className="neo-brutal-btn bg-brutal-blue text-white px-8 py-3"
                >
                  Kirim Lagi
                </button>
              </motion.div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-2xl font-black uppercase flex items-center gap-2">
                      <User size={24} /> Nama
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="Siapa namamu?"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-brutal-bg border-3 border-black p-4 font-bold text-xl shadow-brutal focus:shadow-none focus:translate-x-1 focus:translate-y-1 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-2xl font-black uppercase flex items-center gap-2">
                      <MessageSquare size={24} /> WhatsApp
                    </label>
                    <input
                      type="text"
                      name="whatsapp"
                      placeholder="+62 atau 08..."
                      value={formData.whatsapp}
                      onChange={handleChange}
                      className="w-full bg-brutal-bg border-3 border-black p-4 font-bold text-xl shadow-brutal focus:shadow-none focus:translate-x-1 focus:translate-y-1 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-2xl font-black uppercase">Jenis Layanan</label>
                    <select
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      className="w-full bg-brutal-bg border-3 border-black p-4 font-bold text-xl shadow-brutal outline-none cursor-pointer appearance-none"
                    >
                      <option value="desain">🎨 Desain Grafis</option>
                      <option value="tugas">📚 Joki Tugas</option>
                      <option value="konsultasi">💡 Konsultasi Kreatif</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-2xl font-black uppercase">Deadline</label>
                    <input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                      className="w-full bg-brutal-bg border-3 border-black p-4 font-bold text-xl shadow-brutal outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-2xl font-black uppercase">Detail Request</label>
                  <textarea
                    name="detail"
                    rows="4"
                    placeholder="Ceritain detail tugas atau desain yang kamu mau..."
                    value={formData.detail}
                    onChange={handleChange}
                    className="w-full bg-brutal-bg border-3 border-black p-4 font-bold text-xl shadow-brutal focus:shadow-none focus:translate-x-1 focus:translate-y-1 transition-all outline-none resize-none"
                  ></textarea>
                </div>

                {error && (
                  <motion.div 
                    initial={{ x: -10 }}
                    animate={{ x: [0, -10, 10, -10, 0] }}
                    className="bg-red-400 border-3 border-black p-4 font-black text-white shadow-brutal"
                  >
                    ⚠️ {error}
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02, rotate: -1 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  className={`w-full py-6 font-black text-3xl uppercase border-3 border-black shadow-brutal-lg transition-all flex items-center justify-center gap-4 ${
                    loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-brutal-orange text-white hover:bg-black'
                  }`}
                >
                  {loading ? 'Sabar Ya...' : (
                    <>Kirim Sekarang <Send size={32} /></>
                  )}
                </motion.button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default OrderForm
