import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EmailAuthProps {
  onBack: () => void;
}

export default function EmailAuth({ onBack }: EmailAuthProps) {
  const { signInEmail, signUpEmail } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signInEmail(formData.email, formData.password);
      } else {
        if (!formData.name) throw new Error('Nama lengkap diperlukan');
        if (formData.password.length < 6) throw new Error('Kata sandi harus minimal 6 karakter');
        await signUpEmail(formData.email, formData.password, formData.name);
      }
    } catch (err: any) {
      let message = 'Terjadi kesalahan sistem';
      
      // Handle specific Firebase error codes
      switch (err.code) {
        case 'auth/weak-password':
          message = 'Kata sandi terlalu lemah (minimal 6 karakter).';
          break;
        case 'auth/email-already-in-use':
          message = 'Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.';
          break;
        case 'auth/operation-not-allowed':
          message = 'Metode login Email/Password belum diaktifkan di Console Firebase.';
          break;
        case 'auth/invalid-email':
          message = 'Format email tidak valid.';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          message = 'Email atau kata sandi salah.';
          break;
        default:
          message = err.message || message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="w-full max-w-md mx-auto p-10 bg-dark-panel border border-dark-border rounded-sm shadow-2xl"
    >
      <button 
        onClick={onBack}
        className="flex items-center space-x-3 text-dark-muted hover:text-white transition-colors mb-10 text-[9px] font-bold uppercase tracking-[0.2em]"
      >
        <ArrowLeft size={12} />
        <span>KEMBALI KE METODE AKSES</span>
      </button>

      <h2 className="text-3xl font-bold tracking-tight text-white mb-3">
        {isLogin ? 'Autentikasi' : 'Registrasi'}
      </h2>
      <p className="text-xs text-dark-muted mb-10 font-medium">
        {isLogin ? 'Silakan masukkan kredensial Anda untuk akses sistem.' : 'Lengkapi formulir untuk pendaftaran entitas baru.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-8 text-left">
        {!isLogin && (
          <div className="space-y-3">
            <label className="text-[9px] font-bold uppercase tracking-widest text-dark-muted block ml-1">Nama Identitas</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-muted" size={14} />
              <input 
                type="text"
                required
                className="w-full bg-dark-surface border border-dark-border rounded-sm px-11 py-4 text-xs font-medium focus:outline-none focus:border-gold transition-all placeholder:text-dark-muted/30"
                placeholder="NAMA LENGKAP"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>
        )}

        <div className="space-y-3">
          <label className="text-[9px] font-bold uppercase tracking-widest text-dark-muted block ml-1">Akun Surel</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-muted" size={14} />
            <input 
              type="email"
              required
              className="w-full bg-dark-surface border border-dark-border rounded-sm px-11 py-4 text-xs font-medium focus:outline-none focus:border-gold transition-all placeholder:text-dark-muted/30"
              placeholder="ALAMAT EMAIL RESMI"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[9px] font-bold uppercase tracking-widest text-dark-muted block ml-1">Kata Sandi</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-muted" size={14} />
            <input 
              type="password"
              required
              className="w-full bg-dark-surface border border-dark-border rounded-sm px-11 py-4 text-xs font-medium focus:outline-none focus:border-gold transition-all placeholder:text-dark-muted/30"
              placeholder="KODE AKSES"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
        </div>

        {error && (
          <div className="space-y-3">
            <div className="text-[9px] font-bold uppercase tracking-widest text-red-400 bg-red-400/5 p-4 border border-red-400/20 rounded-sm">
              {error}
            </div>
            {error.toLowerCase().includes('sudah terdaftar') && (
              <button 
                type="button"
                onClick={() => setIsLogin(true)}
                className="text-[9px] font-bold text-gold hover:text-white underline uppercase tracking-widest block w-full text-center"
              >
                Sudah punya akun? Masuk Sekarang →
              </button>
            )}
          </div>
        )}

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-white text-black font-bold text-[10px] uppercase tracking-[0.2em] py-5 rounded-sm hover:bg-gold transition-all disabled:opacity-50 flex items-center justify-center space-x-3 shadow-lg"
        >
          {loading ? <Loader2 className="animate-spin" size={14} /> : (isLogin ? 'VERIFIKASI AKSES' : 'KONFIRMASI PENDAFTARAN')}
        </button>
      </form>

      <div className="mt-10 pt-10 border-t border-dark-border text-center">
        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="text-[9px] font-bold uppercase tracking-[0.2em] text-dark-muted hover:text-white transition-colors"
        >
          {isLogin ? 'PROSES PENDAFTARAN BARU' : 'SUDAH MEMILIKI AKSES? MASUK'}
        </button>
      </div>
    </motion.div>
  );
}
