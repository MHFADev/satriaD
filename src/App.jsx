import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Services from './components/Services'
import Portfolio from './components/Portfolio'
import OrderForm from './components/OrderForm'
import Footer from './components/Footer'
import FloatingShapes from './components/FloatingShapes'
import AdminPanel from './components/AdminPanel'
import TelegramTools from './components/TelegramTools'

const LandingPage = () => (
  <div className="font-brutal text-black selection:bg-brutal-pink selection:text-white">
    <FloatingShapes />
    <Navbar />
    <Hero />
    <Services />
    <Portfolio />
    <OrderForm />
    <Footer />
  </div>
)

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/tools/telegram" element={<TelegramTools />} />
      </Routes>
    </Router>
  )
}

export default App
