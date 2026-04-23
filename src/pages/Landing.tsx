import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { FileCheck, ShieldCheck, Clock, BarChart3, LogIn, ArrowRight, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import EmailAuth from '../components/EmailAuth';

export default function Landing() {
  const { user, signIn, loading } = useAuth();

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showEmailAuth, setShowEmailAuth] = useState(false);

  if (!loading && user) {
    return <Navigate to="/dashboard" />;
  }

  const handleGoogleSignIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      await signIn();
    } finally {
      setIsSigningIn(false);
    }
  };

  const features = [
    {
      title: "Verifikasi Elit",
      description: "Proses validasi dokumen SPJ dengan standar akurasi tinggi dan efisiensi waktu.",
      icon: FileCheck,
      color: "text-gold"
    },
    {
      title: "Keamanan Berlapis",
      description: "Infrastruktur otentikasi aman yang melindungi data dan privasi setiap entitas.",
      icon: ShieldCheck,
      color: "text-gold"
    },
    {
      title: "Monitoring Senyap",
      description: "Pantau status dokumen secara diskrit dan real-time dari manapun Anda berada.",
      icon: Clock,
      color: "text-gold"
    },
    {
      title: "Analisis Mendalam",
      description: "Rekapitulasi data yang komprehensif untuk mendukung pengambilan keputusan.",
      icon: BarChart3,
      color: "text-gold"
    }
  ];

  return (
    <div className="min-h-screen bg-dark-surface text-[#e5e7eb] font-sans overflow-x-hidden selection:bg-gold selection:text-black">
      {/* Hero Section */}
      <header className="relative py-12 px-4">
        <div className="container mx-auto">
          <nav className="flex justify-between items-center mb-24 max-w-6xl mx-auto">
            <div 
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={() => setShowEmailAuth(false)}
            >
              <h1 className="text-2xl font-bold tracking-tighter text-white leading-none group-hover:text-gold transition-colors">VERIF.SPJ</h1>
              <span className="text-[9px] uppercase tracking-[0.4em] text-dark-muted hidden sm:block border-l border-dark-border pl-4 ml-4">Enterprise Edition</span>
            </div>
            {!showEmailAuth && (
              <button 
                onClick={() => setShowEmailAuth(true)}
                className="text-[10px] font-bold uppercase tracking-widest text-white hover:text-black hover:bg-white transition-all border border-white/20 px-8 py-3 rounded-sm"
              >
                MASUK PORTAL
              </button>
            )}
          </nav>

          <div className="max-w-5xl mx-auto text-center relative">
            <AnimatePresence mode="wait">
              {showEmailAuth ? (
                <EmailAuth onBack={() => setShowEmailAuth(false)} />
              ) : (
                <motion.div
                  key="hero"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <div className="inline-block px-4 py-1.5 bg-dark-panel border border-dark-border rounded-full mb-8">
                    <span className="text-[10px] font-bold text-dark-muted uppercase tracking-[0.3em]">System Version 2.4.0</span>
                  </div>
                  <h1 className="text-5xl md:text-8xl font-bold text-white mb-10 tracking-tight leading-[1.05]">
                    Efisiensi Validasi <br /> <span className="text-gold">Pertanggungjawaban.</span>
                  </h1>
                  <p className="text-xl text-dark-muted mb-16 max-w-2xl mx-auto font-normal leading-relaxed">
                    Sistem otomasi verifikasi dokumen SPJ dengan standar kepatuhan tinggi untuk instansi modern yang mengutamakan kecepatan.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <button 
                      onClick={handleGoogleSignIn}
                      disabled={isSigningIn}
                      className="group relative inline-flex items-center space-x-6 bg-white text-black font-bold text-[10px] uppercase tracking-[0.2em] px-12 py-5 rounded-sm transition-all hover:bg-gold disabled:opacity-50"
                    >
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
                      <span>{isSigningIn ? 'PROSES...' : 'GOOGLE GATEWAY'}</span>
                    </button>

                    <button 
                      onClick={() => setShowEmailAuth(true)}
                      className="inline-flex items-center space-x-6 bg-transparent text-white border border-white/20 font-bold text-[10px] uppercase tracking-[0.2em] px-12 py-5 rounded-sm hover:border-white transition-all"
                    >
                      <Mail size={16} />
                      <span>EMAIL GATEWAY</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 bg-dark-panel/50 backdrop-blur-sm border-y border-dark-border">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group"
              >
                <div className="w-12 h-12 bg-dark-surface border border-dark-border rounded-lg flex items-center justify-center mb-8 group-hover:border-gold transition-colors">
                  <feature.icon size={22} className={feature.color} strokeWidth={2} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-4">{feature.title}</h3>
                <p className="text-dark-muted text-xs leading-relaxed font-medium">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-dark-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-serif italic text-white mb-2">Verif.SPJ</h2>
              <p className="text-[10px] uppercase tracking-widest text-dark-muted">Standard Operating Procedure Excellence</p>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-dark-muted">
              &copy; {new Date().getFullYear()} SPJ Management System.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
