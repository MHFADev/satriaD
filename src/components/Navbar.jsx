import React from 'react'
import { motion } from 'framer-motion'

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-brutal-bg border-b-3 border-black py-4 px-6 md:px-12 flex justify-between items-center">
      <div className="flex items-center gap-3 group cursor-pointer">
        <div className="w-12 h-12 border-3 border-black bg-white overflow-hidden shadow-brutal group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all">
          <img 
            src="https://cdn.jsdelivr.net/gh/mhfadev/asset@main/logo/Gemini_Generated_Image_pvwozwpvwozwpvwo-removebg-preview.png" 
            alt="Logo" 
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-3xl font-black tracking-tighter uppercase italic">SatriaD</h1>
      </div>
      
      <div className="hidden md:flex gap-8 font-bold text-lg">
        {['Layanan', 'Portfolio', 'Order'].map((item) => (
          <motion.a 
            key={item}
            href={`#${item.toLowerCase()}`}
            whileHover={{ scale: 1.1, color: '#FF5C00' }}
            className="hover:underline decoration-4 underline-offset-4"
          >
            {item}
          </motion.a>
        ))}
      </div>

      <motion.button 
        whileHover={{ scale: 1.05, rotate: 1 }}
        whileTap={{ scale: 0.95 }}
        className="neo-brutal-btn bg-brutal-yellow text-sm md:text-base"
      >
        Mulai Project!
      </motion.button>
    </nav>
  )
}

export default Navbar
