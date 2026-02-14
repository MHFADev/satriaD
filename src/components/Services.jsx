import React from 'react'
import { motion } from 'framer-motion'
import { Layout, Image, Share2, BookOpen, Presentation, FileSearch } from 'lucide-react'

const ServiceCard = ({ title, items, icon: Icon, color }) => (
  <motion.div 
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ type: "spring", stiffness: 50, damping: 20 }}
    whileHover={{ y: -15, rotate: -1.5, transition: { type: "spring", stiffness: 300 } }}
    className={`neo-brutal-card ${color} relative overflow-hidden group min-h-[400px] flex flex-col justify-between`}
  >
    <div>
      <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
        <Icon size={140} />
      </div>
      <div className="mb-8 bg-white border-3 border-black w-16 h-16 flex items-center justify-center shadow-brutal -rotate-3 group-hover:rotate-0 transition-transform duration-300">
        <Icon className="w-9 h-9" />
      </div>
      <h3 className="text-4xl font-black mb-6 uppercase tracking-tight">{title}</h3>
      <ul className="space-y-4">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center gap-3 font-bold text-xl">
            <div className="w-2.5 h-2.5 bg-black rounded-full group-hover:scale-125 transition-transform" />
            {item}
          </li>
        ))}
      </ul>
    </div>
    <motion.button 
      whileHover={{ scale: 1.02, backgroundColor: '#000', color: '#fff' }}
      whileTap={{ scale: 0.98 }}
      className="mt-10 w-full bg-white border-3 border-black py-3 font-black uppercase shadow-brutal transition-all text-lg"
    >
      Pilih Ini!
    </motion.button>
  </motion.div>
)

const Services = () => {
  const designServices = [
    "Poster & Banner",
    "Feed Instagram",
    "Logo & Branding",
    "Undangan Digital"
  ]

  const taskServices = [
    "Makalah & Jurnal",
    "PPT Interaktif",
    "Resume/CV Kreatif",
    "Tugas Rangkuman"
  ]

  return (
    <section id="layanan" className="py-24 px-6 md:px-12 bg-white border-b-3 border-black">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-xl">
            <h2 className="text-5xl md:text-7xl font-black uppercase mb-6 leading-none">
              PILIH <span className="text-brutal-blue">VIBE</span> <br /> KAMU!
            </h2>
            <p className="text-xl font-bold">Apapun masalahnya, solusinya ada di SatriaD. Cepat, tepat, dan nggak bikin pusing.</p>
          </div>
          <div className="bg-brutal-yellow border-3 border-black px-6 py-2 shadow-brutal -rotate-2">
            <p className="font-black text-2xl uppercase">Harga Mahasiswa!</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <ServiceCard 
            title="Jasa Desain"
            items={designServices}
            icon={Image}
            color="bg-brutal-orange"
          />
          <ServiceCard 
            title="Joki Tugas"
            items={taskServices}
            icon={BookOpen}
            color="bg-brutal-blue text-white"
          />
        </div>
      </div>
    </section>
  )
}

export default Services
