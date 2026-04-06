import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, TrendingUp, ShieldCheck, ArrowRight, Layers, Globe, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Footer } from '../components/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full bg-[#0f172a]/80 backdrop-blur-xl z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <span className="font-black text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                Enterprise<span className="text-indigo-400">OMS</span>
              </span>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:flex gap-8 items-center"
            >
              <Link to="/login" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Platform</Link>
              <Link to="/login" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Solutions</Link>
              <Link to="/login" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">Enterprise</Link>
              <div className="h-4 w-px bg-white/10 mx-2" />
              <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">Sign in</Link>
              <Link to="/signup" className="group relative px-5 py-2.5 bg-white text-[#0f172a] rounded-full font-bold text-sm hover:scale-105 transition-all overflow-hidden">
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-6">
                <Zap className="w-3 h-3 fill-current" /> Next-Gen Commerce
              </div>
              <h1 className="text-6xl sm:text-8xl font-black leading-[1.1] mb-8">
                The <span className="text-indigo-500">Intelligent</span> Layer for Global Trade.
              </h1>
              <p className="text-xl text-slate-400 mb-10 max-w-xl leading-relaxed">
                Experience the Enterprise Order Management System that unifies complex supply chains into a single, high-performance interface. 
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link to="/signup" className="group flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-2xl shadow-indigo-600/20">
                  Deploy to Production <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/login" className="flex items-center gap-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white px-8 py-4 rounded-2xl font-bold transition-all backdrop-blur-sm">
                  View Demo
                </Link>
              </div>

              {/* Stats Preview */}
              <div className="mt-16 grid grid-cols-3 gap-8 pt-8 border-t border-white/5">
                {[
                  { l: 'Uptime', v: '99.9%' },
                  { l: 'Throughput', v: '10M+' },
                  { l: 'Global Sites', v: '500+' }
                ].map(s => (
                  <div key={s.l}>
                    <div className="text-2xl font-black text-white">{s.v}</div>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{s.l}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right Side - 3D Mockup Simulation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="relative hidden lg:block"
              style={{ perspective: '1200px' }}
            >
              <div className="relative z-10 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-[32px] p-2 border border-white/10 backdrop-blur-3xl overflow-hidden shadow-2xl">
                <div className="bg-[#0f172a] rounded-[24px] overflow-hidden border border-white/5 aspect-square relative group">
                  {/* Decorative Elements */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-indigo-500/20 blur-[100px] rounded-full group-hover:scale-125 transition-transform duration-1000" />
                  
                  {/* Mock Dashboard Widgets */}
                  <div className="absolute inset-8 grid grid-cols-2 gap-4">
                    <motion.div 
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col justify-between"
                    >
                      <TrendingUp className="w-8 h-8 text-indigo-400" />
                      <div className="h-2 w-1/2 bg-white/20 rounded-full" />
                    </motion.div>
                    <motion.div 
                      animate={{ y: [0, 10, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col justify-between"
                    >
                      <Layers className="w-8 h-8 text-violet-400" />
                      <div className="h-2 w-1/3 bg-white/20 rounded-full" />
                    </motion.div>
                  </div>
                  
                  <div className="absolute bottom-8 left-8 right-8 h-32 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center justify-center">
                    <div className="w-full px-8 space-y-3">
                      <div className="h-3 w-3/4 bg-white/20 rounded-full" />
                      <div className="h-3 w-1/2 bg-white/10 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Icons */}
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-600/40 border border-white/20"
              >
                <Globe className="w-10 h-10 text-white" />
              </motion.div>
            </motion.div>
          </div>

          {/* Features Grid */}
          <div className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                t: 'Global Inventory', 
                d: 'Real-time synchronization across hundreds of logic centers and store fronts automatically.',
                i: <Globe className="w-6 h-6" />,
                c: 'from-blue-500/20 to-indigo-500/20'
              },
              { 
                t: 'Zero-Latency Logic', 
                d: 'Process orders with near-instant validation and credit checks at world-wide scale.',
                i: <Zap className="w-6 h-6" />,
                c: 'from-amber-500/20 to-orange-500/20'
              },
              { 
                t: 'Secure RBAC', 
                d: 'Granular permissions for Customers, Support Staff, and Warehouse teams built-in.',
                i: <ShieldCheck className="w-6 h-6" />,
                c: 'from-violet-500/20 to-purple-500/20'
              }
            ].map((f, idx) => (
              <motion.div
                key={f.t}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="group relative"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${f.c} rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="relative h-full bg-white/5 border border-white/10 backdrop-blur-sm rounded-3xl p-10 hover:border-white/20 transition-all">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-8">
                    {f.i}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{f.t}</h3>
                  <p className="text-slate-400 leading-relaxed">{f.d}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>


      {/* Footer Section */}
      <Footer variant="dark" />
    </div>
  );
};

