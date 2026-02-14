import React from 'react'
import { motion } from 'framer-motion'

const FloatingShapes = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Circle */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 360],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 5, repeat: Infinity }}
        className="absolute top-[10%] left-[5%] w-12 h-12 border-4 border-black rounded-full bg-brutal-yellow"
      />
      
      {/* Square */}
      <motion.div
        animate={{
          y: [0, 20, 0],
          rotate: [0, -360],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 7, repeat: Infinity }}
        className="absolute bottom-[20%] right-[10%] w-16 h-16 border-4 border-black bg-brutal-orange shadow-brutal"
      />

      {/* Triangle (using clip-path or just a div with border) */}
      <motion.div
        animate={{
          x: [0, 30, 0],
          rotate: [45, 225, 45],
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-[40%] right-[5%] w-10 h-10 border-4 border-black bg-brutal-pink"
        style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}
      />

      {/* Small Dots */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1]
          }}
          transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
          className="absolute w-4 h-4 rounded-full bg-black"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
        />
      ))}
    </div>
  )
}

export default FloatingShapes
