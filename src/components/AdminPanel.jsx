import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Plus, Trash2, LogOut, Package, MessageSquare, Image as ImageIcon } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const AdminPanel = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [projects, setProjects] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' or 'orders'
  
  // New Project State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Graphic Design');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('satriad_token');
    if (token) {
      setIsLoggedIn(true);
      fetchData(token);
    }
  }, []);

  const fetchData = async (token) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [projRes, orderRes] = await Promise.all([
        axios.get(`${API_URL}/projects`),
        axios.get(`${API_URL}/orders`, config)
      ]);
      setProjects(projRes.data);
      setOrders(orderRes.data);
    } catch (err) {
      console.error('Fetch error', err);
      if (err.response?.status === 401) handleLogout();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/admin/login`, { username, password });
      localStorage.setItem('satriad_token', res.data.token);
      setIsLoggedIn(true);
      fetchData(res.data.token);
    } catch (err) {
      alert('Login gagal! Cek username/password.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('satriad_token');
    setIsLoggedIn(false);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!image) return alert('Pilih gambar dulu!');
    
    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('description', description);
    formData.append('image', image);

    try {
      const token = localStorage.getItem('satriad_token');
      await axios.post(`${API_URL}/projects`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      alert('Project berhasil diupload!');
      setTitle('');
      setDescription('');
      setImage(null);
      fetchData(token);
    } catch (err) {
      alert('Gagal upload project.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id) => {
    if (!confirm('Yakin mau hapus project ini?')) return;
    try {
      const token = localStorage.getItem('satriad_token');
      await axios.delete(`${API_URL}/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData(token);
    } catch (err) {
      alert('Gagal hapus project.');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-brutal-bg flex items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white border-3 border-black p-8 shadow-brutal-xl w-full max-w-md"
        >
          <h2 className="text-4xl font-black uppercase mb-8 text-center">Admin Login</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block font-black uppercase mb-2">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border-3 border-black p-3 font-bold outline-none shadow-brutal focus:shadow-none focus:translate-x-1 focus:translate-y-1 transition-all"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block font-black uppercase mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-3 border-black p-3 font-bold outline-none shadow-brutal focus:shadow-none focus:translate-x-1 focus:translate-y-1 transition-all"
                placeholder="••••••"
              />
            </div>
            <button type="submit" className="w-full neo-brutal-btn bg-brutal-orange text-white py-4 text-xl font-black uppercase">
              Masuk
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brutal-bg p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <h1 className="text-5xl font-black uppercase italic">Admin Panel</h1>
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('projects')}
              className={`px-6 py-2 border-3 border-black font-black uppercase shadow-brutal transition-all ${activeTab === 'projects' ? 'bg-brutal-yellow' : 'bg-white'}`}
            >
              Projects
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`px-6 py-2 border-3 border-black font-black uppercase shadow-brutal transition-all ${activeTab === 'orders' ? 'bg-brutal-blue text-white' : 'bg-white'}`}
            >
              Orders
            </button>
            <button onClick={handleLogout} className="p-3 bg-red-500 text-white border-3 border-black shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
              <LogOut size={24} />
            </button>
          </div>
        </div>

        {activeTab === 'projects' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Upload Form */}
            <div className="lg:col-span-1">
              <div className="bg-white border-3 border-black p-6 shadow-brutal-lg sticky top-28">
                <h3 className="text-2xl font-black uppercase mb-6 flex items-center gap-2">
                  <Plus /> Upload Project
                </h3>
                <form onSubmit={handleUpload} className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Judul Project"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border-3 border-black p-3 font-bold outline-none"
                    required
                  />
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border-3 border-black p-3 font-bold outline-none bg-white"
                  >
                    <option value="Graphic Design">Graphic Design</option>
                    <option value="Assignment">Assignment Help</option>
                    <option value="Other">Other</option>
                  </select>
                  <textarea 
                    placeholder="Deskripsi (Opsional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border-3 border-black p-3 font-bold outline-none h-24 resize-none"
                  ></textarea>
                  <div className="border-3 border-black p-3 bg-brutal-bg relative">
                    <input 
                      type="file" 
                      onChange={(e) => setImage(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept="image/*"
                    />
                    <div className="flex items-center gap-2 font-bold uppercase overflow-hidden">
                      <ImageIcon size={20} />
                      {image ? image.name : 'Pilih Foto'}
                    </div>
                  </div>
                  <button 
                    disabled={loading}
                    className="w-full py-4 bg-brutal-orange text-white border-3 border-black font-black uppercase shadow-brutal hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Simpan Project'}
                  </button>
                </form>
              </div>
            </div>

            {/* Project List */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-3xl font-black uppercase flex items-center gap-2">
                <Package /> Project List ({projects.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map(proj => (
                  <div key={proj.id} className="bg-white border-3 border-black p-4 shadow-brutal group relative">
                    <div className="aspect-video border-3 border-black mb-4 overflow-hidden">
                      <img src={proj.imageUrl} alt={proj.title} className="w-full h-full object-cover" />
                    </div>
                    <h4 className="text-xl font-black uppercase">{proj.title}</h4>
                    <p className="text-sm font-bold text-gray-600 uppercase mb-4">{proj.category}</p>
                    <button 
                      onClick={() => handleDeleteProject(proj.id)}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white border-3 border-black shadow-brutal opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-3xl font-black uppercase flex items-center gap-2">
              <MessageSquare /> Pesanan Masuk ({orders.length})
            </h3>
            <div className="overflow-x-auto border-3 border-black shadow-brutal-lg bg-white">
              <table className="w-full text-left">
                <thead className="bg-black text-white uppercase font-black">
                  <tr>
                    <th className="p-4 border-r-3 border-white">Nama</th>
                    <th className="p-4 border-r-3 border-white">WhatsApp</th>
                    <th className="p-4 border-r-3 border-white">Layanan</th>
                    <th className="p-4 border-r-3 border-white">Deadline</th>
                    <th className="p-4">Detail</th>
                  </tr>
                </thead>
                <tbody className="font-bold">
                  {orders.map(order => (
                    <tr key={order.id} className="border-t-3 border-black hover:bg-brutal-bg">
                      <td className="p-4 border-r-3 border-black uppercase">{order.name}</td>
                      <td className="p-4 border-r-3 border-black">
                        <a href={`https://wa.me/${order.whatsapp.replace(/\+/g, '')}`} target="_blank" className="underline text-brutal-blue">
                          {order.whatsapp}
                        </a>
                      </td>
                      <td className="p-4 border-r-3 border-black uppercase">{order.service}</td>
                      <td className="p-4 border-r-3 border-black">{order.deadline || '-'}</td>
                      <td className="p-4">{order.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
