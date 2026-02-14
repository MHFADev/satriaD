import React from 'react'
import { motion } from 'framer-motion'
import { Instagram, MessageCircle, Heart } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-black text-white py-16 px-6 md:px-12">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
        <div className="text-center md:text-left">
          <h2 className="text-4xl font-black mb-4">SATRIA<span className="text-brutal-orange">D</span></h2>
          <p className="font-bold text-gray-400 max-w-xs">
            Solusi kreatif paling artsy untuk mahasiswa dan UMKM Indonesia.
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <p className="font-black uppercase tracking-widest text-sm text-gray-500">Find Us On</p>
          <div className="flex gap-8">
            <motion.a 
              href="#"
              whileHover={{ scale: 1.2, rotate: 15 }}
              className="bg-brutal-orange p-4 border-3 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
            >
              <Instagram className="w-8 h-8" />
            </motion.a>
            <motion.a 
              href="#"
              whileHover={{ scale: 1.2, rotate: -15 }}
              className="bg-brutal-blue p-4 border-3 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]"
            >
              <MessageCircle className="w-8 h-8" />
            </motion.a>
          </div>
        </div>

        <div className="text-center md:text-right">
          <p className="font-bold flex items-center justify-center md:justify-end gap-2">
            Made with <Heart className="w-5 h-5 text-brutal-pink fill-brutal-pink" /> by SatriaD
          </p>
          <p className="text-sm text-gray-500 mt-2">© 2026 SatriaD. All Rights Reserved.</p>
        </div>
      </div>
      
      {/* Decorative Bottom Bar */}
      <div className="mt-16 overflow-hidden whitespace-nowrap border-t-2 border-gray-800 pt-8">
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="flex gap-12 text-2xl font-black uppercase opacity-10"
        >
          {Array(10).fill(null).map((_, i) => (
            <span key={i}>Tugas Kelar Desain Cetar • SatriaD Kreatif • Joki Terpercaya • </span>
          ))}
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer
