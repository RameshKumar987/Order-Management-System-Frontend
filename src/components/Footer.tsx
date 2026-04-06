import React from 'react';
import { motion } from 'framer-motion';
import { 
  Package, Globe, Share2, 
  Mail, ShieldCheck, Zap, 
  ChevronRight, CreditCard, 
  Truck, HelpCircle, 
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface FooterProps {
  variant?: 'light' | 'dark';
}

export const Footer: React.FC<FooterProps> = ({ variant = 'light' }) => {
  const currentYear = new Date().getFullYear();
  const isDark = variant === 'dark';

  const theme = {
    bg: isDark ? 'bg-[#0f172a]' : 'bg-white/40',
    border: isDark ? 'border-white/5' : 'border-white/20',
    text: isDark ? 'text-slate-400' : 'text-slate-500',
    title: isDark ? 'text-white' : 'text-slate-900',
    card: isDark ? 'bg-white/5 border-white/10' : 'bg-white/60 border-white/40',
    accent: isDark ? 'text-indigo-400' : 'text-indigo-600',
    hover: isDark ? 'hover:text-white' : 'hover:text-indigo-600',
  };

  return (
    <footer className={`mt-auto relative overflow-hidden ${theme.bg} backdrop-blur-xl border-t ${theme.border} pt-20 pb-10 transition-all z-10 font-sans`}>
      {/* Dynamic Background Elements */}
      {!isDark && (
        <>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-100/30 rounded-full blur-3xl -z-10" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-100/30 rounded-full blur-3xl -z-10" />
        </>
      )}

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          
          {/* Brand & Connectivity */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-500/20">
                <Package className="w-6 h-6 text-white" />
              </div>
              <span className={`text-2xl font-black ${theme.title} tracking-tighter`}>
                Enterprise<span className={theme.accent}>OMS</span>
              </span>
            </div>
            <p className={`text-sm ${theme.text} font-medium leading-relaxed max-w-xs`}>
              High-performance logistics intelligence for the modern trade era. Unified commerce simplified.
            </p>
            <div className="flex items-center gap-4">
              <SocialIcon icon={Globe} isDark={isDark} />
              <SocialIcon icon={Share2} isDark={isDark} />
              <SocialIcon icon={Package} isDark={isDark} />
            </div>
          </div>

          {/* Shop Registry */}
          <div className="space-y-8">
            <h4 className={`text-xs font-black ${theme.accent} uppercase tracking-[0.2em]`}>Merchant Registry</h4>
            <ul className="space-y-5">
              <FooterLink to="/customer/products" isDark={isDark}>Marketplace Catalog</FooterLink>
              <FooterLink to="/inventory" isDark={isDark}>Asset Suite</FooterLink>
              <FooterLink to="/admin" isDark={isDark}>Operational View</FooterLink>
              <FooterLink to="/" isDark={isDark}>Latest SKUs</FooterLink>
            </ul>
          </div>

          {/* Support Architecture */}
          <div className="space-y-8">
            <h4 className={`text-xs font-black ${theme.accent} uppercase tracking-[0.2em]`}>Technical Hub</h4>
            <ul className="space-y-5">
              <FooterLink to="/customer/orders" isDark={isDark} icon={<Truck className="w-3.5 h-3.5" />}>Track Shipment</FooterLink>
              <FooterLink to="/" isDark={isDark} icon={<HelpCircle className="w-3.5 h-3.5" />}>FAQ Gateway</FooterLink>
              <FooterLink to="/" isDark={isDark} icon={<ShieldCheck className="w-3.5 h-3.5" />}>Privacy Guard</FooterLink>
              <FooterLink to="/" isDark={isDark} icon={<Mail className="w-3.5 h-3.5" />}>Support Protocol</FooterLink>
            </ul>
          </div>

          {/* Newsletter / System Status */}
          <div className="space-y-8">
            <h4 className={`text-xs font-black ${theme.accent} uppercase tracking-[0.2em]`}>Join our Network</h4>
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Secure email registry..." 
                className={`w-full px-5 py-4 ${isDark ? 'bg-white/5 text-white border-white/10' : 'bg-slate-100/50 text-slate-800 border-slate-200'} rounded-2xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm`}
              />
              <button className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors">
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className={`p-5 ${theme.card} rounded-[28px] border shadow-sm space-y-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`w-4 h-4 ${isDark ? 'text-indigo-400' : 'text-emerald-500'}`} />
                  <span className={`text-[10px] font-black ${theme.title} uppercase tracking-widest`}>Backend Status</span>
                </div>
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className={`text-[10px] font-black ${theme.title} uppercase tracking-widest`}>API Latency</span>
                </div>
                <span className="text-[10px] font-black text-emerald-600 uppercase">Synchronized</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className={`pt-10 border-t ${theme.border} flex flex-col lg:flex-row justify-between items-center gap-8`}>
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <p className={`text-[10px] font-black ${theme.text} uppercase tracking-[0.3em]`}>
              © {currentYear} SystemOMS Platform.
            </p>
            <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest">
              <a href="#" className={`${theme.text} ${theme.hover} transition-colors`}>Legal Logic</a>
              <a href="#" className={`${theme.text} ${theme.hover} transition-colors`}>Security Protocol</a>
              <a href="#" className={`${theme.text} ${theme.hover} transition-colors`}>GDPR Compliance</a>
            </div>
          </div>
          
          {/* Payment Simulation Icons */}
          <div className="flex items-center gap-6 opacity-30 grayscale hover:grayscale-0 hover:opacity-80 transition-all duration-500">
             <CreditCard className={`w-6 h-6 ${theme.title}`} />
             <div className="h-4 w-px bg-slate-500/20" />
             <ShieldCheck className={`w-6 h-6 ${theme.title}`} />
             <div className="h-4 w-px bg-slate-500/20" />
             <Package className={`w-6 h-6 ${theme.title}`} />
          </div>
        </div>
      </div>
    </footer>
  );
};

const FooterLink: React.FC<{ to: string; children: React.ReactNode; isDark: boolean; icon?: React.ReactNode }> = ({ to, children, isDark, icon }) => (
  <li className="group">
    <Link to={to} className={`text-sm font-black ${isDark ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-indigo-600'} flex items-center gap-3 transition-all group-hover:translate-x-1 duration-300`}>
      <span className={`flex-shrink-0 ${isDark ? 'text-slate-600 group-hover:text-indigo-400' : 'text-slate-300 group-hover:text-indigo-600'}`}>
        {icon || <ChevronRight className="w-3.5 h-3.5" />}
      </span>
      {children}
    </Link>
  </li>
);

const SocialIcon: React.FC<{ icon: React.ElementType; isDark: boolean }> = ({ icon: Icon, isDark }) => (
  <motion.a
    href="#"
    whileHover={{ y: -4, scale: 1.1, rotate: -5 }}
    className={`w-11 h-11 ${isDark ? 'bg-white/5 text-slate-400 border-white/10 hover:text-white hover:bg-indigo-600 shadow-indigo-500/10' : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-indigo-600 hover:bg-white shadow-slate-200/50'} rounded-2xl flex items-center justify-center shadow-lg border transition-all`}
  >
    <Icon className="w-5 h-5" />
  </motion.a>
);
