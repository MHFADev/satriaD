import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Palette, FileText } from 'lucide-react'
import FloatingShapes from './FloatingShapes'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    }
  }
}

const itemVariants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 70,
      damping: 15
    }
  }
}

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-brutal-bg py-24 px-6 md:px-12 border-b-3 border-black">
      <FloatingShapes />
      {/* Decorative Blobs - Smoother and more subtle */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          x: [0, 30, 0],
          y: [0, 20, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-20 -left-20 w-80 h-80 bg-brutal-pink rounded-full opacity-10 blur-3xl"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, -40, 0],
          y: [0, -30, 0]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-20 -right-20 w-96 h-96 bg-brutal-blue rounded-full opacity-10 blur-3xl"
      />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto flex flex-col items-center text-center relative z-10"
      >
        <motion.div
          variants={itemVariants}
          className="mb-8 flex items-center gap-2 bg-white border-3 border-black px-6 py-2 shadow-brutal -rotate-1 hover:rotate-0 transition-transform cursor-default"
        >
          <Sparkles className="w-6 h-6 text-brutal-yellow fill-brutal-yellow" />
          <span className="font-black uppercase tracking-widest text-sm">Tugas Kelar, Desain Cetar</span>
        </motion.div>

        <motion.h1 
          variants={itemVariants}
          className="text-7xl md:text-[10rem] font-black mb-10 leading-[0.85] tracking-tighter"
        >
          KREATIF <br />
          <span className="text-brutal-orange" style={{ WebkitTextStroke: '3px black' }}>TANPA</span> <br />
          BATAS!
        </motion.h1>

        <motion.p 
          variants={itemVariants}
          className="text-xl md:text-3xl font-bold max-w-3xl mb-14 text-gray-800 leading-relaxed"
        >
          Bantu mahasiswa & UMKM tampil beda dengan desain artsy dan tugas yang anti-revisi!
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-8">
          <motion.button 
            whileHover={{ scale: 1.05, rotate: -1, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="neo-brutal-btn bg-brutal-blue text-white text-2xl px-12 py-5 flex items-center gap-4 group"
          >
            <Palette className="w-8 h-8 group-hover:rotate-12 transition-transform" /> Jasa Desain
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05, rotate: 1, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="neo-brutal-btn bg-brutal-pink text-white text-2xl px-12 py-5 flex items-center gap-4 group"
          >
            <FileText className="w-8 h-8 group-hover:-rotate-12 transition-transform" /> Joki Tugas
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  )
}

export default Hero
