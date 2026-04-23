import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SPJDocument } from '../types';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0
  });
  const [recentDocs, setRecentDocs] = useState<SPJDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const docsRef = collection(db, 'documents');
    let q;

    if (profile.role === 'admin') {
      q = query(docsRef, orderBy('createdAt', 'desc'), limit(100));
    } else {
      q = query(docsRef, where('uploadedBy', '==', profile.uid), orderBy('createdAt', 'desc'), limit(100));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SPJDocument));
      
      const newStats = {
        total: docs.length,
        pending: docs.filter(d => d.status === 'pending').length,
        verified: docs.filter(d => d.status === 'verified').length,
        rejected: docs.filter(d => d.status === 'rejected').length
      };
      
      setStats(newStats);
      setRecentDocs(docs.slice(0, 5));
      setLoading(false);
    }, (error) => {
      console.error("Dashboard listener error:", error);
      // If error is permission-denied, it might be due to missing indexes or role sync delay
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const statCards = [
    { label: 'Total Masuk', value: stats.total, icon: FileText, color: 'text-white', bg: 'bg-dark-panel', trend: '+12%' },
    { label: 'Menunggu Validasi', value: stats.pending, icon: Clock, color: 'text-gold', bg: 'bg-dark-panel' },
    { label: 'Terverifikasi', value: stats.verified, icon: CheckCircle, color: 'text-white', bg: 'bg-dark-panel' },
    { label: 'Ditolak / Revisi', value: stats.rejected, icon: XCircle, color: 'text-red-400', bg: 'bg-dark-panel' },
  ];

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-32 bg-dark-panel border border-dark-border rounded-2xl w-full"></div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-24 bg-dark-panel border border-dark-border rounded-xl"></div>)}
    </div>
  </div>;

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[10px] font-medium text-dark-muted uppercase tracking-[0.3em] mb-1">Real-time Overview</h2>
          <h1 className="text-3xl font-bold text-white uppercase">Status Verifikasi SPJ</h1>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] text-dark-muted uppercase tracking-widest leading-none">Sistem Aktif</span>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-dark-panel p-6 rounded-xl border border-dark-border shadow-sm transition-all hover:border-gold/30">
            <p className="text-[10px] text-dark-muted uppercase tracking-widest mb-2">{card.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className={`text-3xl font-light tracking-tight ${card.color}`}>{card.value}</h3>
              {card.trend && <span className="text-[10px] text-emerald-500 font-medium">{card.trend}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-dark-border pb-4">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-white">Antrean Berkas Terbaru</h4>
            <Link to="/recap" className="text-[10px] text-gold uppercase tracking-widest hover:underline flex items-center gap-1">
              Lihat Semua <ArrowRight size={10} />
            </Link>
          </div>
          
          <div className="bg-dark-panel rounded-xl border border-dark-border overflow-hidden">
            {recentDocs.length > 0 ? (
              <div className="divide-y divide-dark-border">
                {recentDocs.map((doc) => (
                  <div key={doc.id} className="p-5 hover:bg-[#121212] transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-dark-border ${
                        doc.status === 'verified' ? 'bg-emerald-950/20 text-emerald-500' :
                        doc.status === 'rejected' ? 'bg-red-950/20 text-red-500' :
                        'bg-amber-950/20 text-amber-500'
                      }`}>
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{doc.title}</p>
                        <p className="text-[10px] text-dark-muted uppercase tracking-widest mt-0.5">
                          {format(doc.createdAt, 'dd MMM yyyy, HH:mm', { locale: id })}
                          {profile?.role === 'admin' && ` • ${doc.uploaderName}`}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[9px] px-2 py-1 rounded font-bold uppercase tracking-widest border ${
                      doc.status === 'verified' ? 'bg-emerald-900/10 text-emerald-500 border-emerald-900/50' :
                      doc.status === 'rejected' ? 'bg-red-900/10 text-red-500 border-red-900/50' :
                      'bg-amber-900/10 text-amber-500 border-amber-900/50'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-dark-muted italic text-sm">
                Belum ada berkas dalam antrean.
              </div>
            )}
          </div>
        </div>

        {/* Quick Action */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-white border-b border-dark-border pb-4">Aksi Cepat</h4>
          <div className="bg-[#0f0f0f] rounded-xl p-8 border border-dark-border space-y-6 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-5 transform group-hover:scale-110 transition-transform">
              <TrendingUp size={140} />
            </div>
            <div className="relative z-10 space-y-6">
              <p className="text-gold text-[10px] uppercase tracking-[0.3em] font-medium">Ready to Process</p>
              <h3 className="text-2xl font-bold text-white leading-tight">
                {profile?.role === 'user' ? 'Administrasi Laporan SPJ Baru' : 'Mulai Tinjau Dokumen Masuk'}
              </h3>
              <Link 
                to={profile?.role === 'user' ? '/upload' : '/verify'}
                className="block w-full py-4 bg-white text-black text-center rounded text-[10px] uppercase tracking-widest font-bold hover:bg-gold transition-colors"
              >
                Jalankan Prosedur
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
