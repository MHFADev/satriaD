import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const Portfolio = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get(`${API_URL}/projects`)
        setProjects(res.data)
      } catch (err) {
        console.error('Gagal mengambil project', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  // Placeholder items if no projects exist in database
  const placeholders = [
    { id: 'p1', title: 'Poster Event', category: 'Graphic Design', color: 'bg-brutal-pink' },
    { id: 'p2', title: 'Social Media', category: 'Graphic Design', color: 'bg-brutal-orange' },
    { id: 'p3', title: 'PPT Design', category: 'Assignment', color: 'bg-brutal-yellow' },
    { id: 'p4', title: 'Paper Work', category: 'Assignment', color: 'bg-brutal-blue' },
  ]

  const displayItems = projects.length > 0 ? projects : placeholders

  return (
    <section id="portfolio" className="py-24 px-6 md:px-12 bg-brutal-bg border-b-3 border-black">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-5xl md:text-7xl font-black uppercase mb-16 text-center">
          KARYA <span className="text-brutal-pink underline decoration-8">TERBARU</span>
        </h2>

        {loading ? (
          <div className="text-center py-20 font-black text-2xl uppercase animate-pulse">
            Loading Karya...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {displayItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  type: "spring", 
                  stiffness: 40, 
                  damping: 15,
                  delay: index * 0.1 
                }}
                whileHover={{ 
                  rotate: index % 2 === 0 ? -2 : 2, 
                  scale: 1.05, 
                  zIndex: 10,
                  transition: { type: "spring", stiffness: 400, damping: 10 }
                }}
                className={`neo-brutal-card ${item.imageUrl ? 'bg-white' : (item.color || 'bg-white')} min-h-[350px] flex flex-col group cursor-pointer transition-all duration-300 shadow-brutal hover:shadow-brutal-xl overflow-hidden`}
              >
                {item.imageUrl ? (
                  <div className="flex-1 border-b-3 border-black overflow-hidden bg-white">
                    <img 
                      src={item.imageUrl.startsWith('data:') ? item.imageUrl : item.imageUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <div className="bg-white border-3 border-black p-6 shadow-brutal -rotate-3 group-hover:rotate-0 transition-all duration-500">
                      <p className="text-2xl font-black uppercase tracking-tight">{item.title}</p>
                    </div>
                  </div>
                )}
                
                <div className="p-5 bg-white border-t-3 border-black">
                  <p className="text-xs font-black uppercase text-gray-500 mb-1">{item.category}</p>
                  <h4 className="text-xl font-black uppercase truncate">{item.title}</h4>
                  <div className="mt-4 bg-black text-white px-5 py-2 font-black text-sm uppercase inline-block group-hover:bg-brutal-orange transition-colors">
                    Lihat Karya ➔
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default Portfolio
