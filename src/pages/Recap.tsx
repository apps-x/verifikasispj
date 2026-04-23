import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { SPJDocument } from '../types';
import { 
  Download, 
  Search, 
  Filter, 
  ExternalLink, 
  Calendar,
  User,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function Recap() {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<SPJDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!profile) return;

    const docsRef = collection(db, 'documents');
    let q;

    if (profile.role === 'admin') {
      q = query(docsRef, orderBy('createdAt', 'desc'));
    } else {
      q = query(docsRef, where('uploadedBy', '==', profile.uid), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SPJDocument));
      setDocuments(docs);
      setLoading(false);
    }, (error) => {
      console.error("Recap listener error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         doc.uploaderName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    // Simulated export
    alert('Fungsi ekspor ke Excel/PDF sedang dalam pengembangan. Data yang difilter: ' + filteredDocs.length + ' baris.');
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[10px] font-medium text-dark-muted uppercase tracking-[0.3em] mb-1">Archive Management</h2>
          <h1 className="text-3xl font-bold text-white uppercase">Rekapitulasi Pelaporan</h1>
        </div>

        <button 
          onClick={handleExport}
          className="bg-dark-panel border border-dark-border px-6 py-3 rounded text-[10px] uppercase tracking-widest font-bold text-white hover:border-gold transition-colors flex items-center gap-2 shadow-sm"
        >
          <Download size={14} />
          <span>Ekspor Database</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-dark-panel p-4 rounded border border-dark-border flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" size={14} />
          <input 
            type="text" 
            placeholder="Cari judul laporan atau pengunggah..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-dark-surface rounded border border-dark-border text-xs text-white focus:border-gold outline-none transition-all uppercase tracking-widest placeholder:text-dark-muted/30"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 min-w-[180px]">
             <Filter size={14} className="text-dark-muted" />
             <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-dark-surface border border-dark-border rounded px-4 py-3 outline-none focus:border-gold text-[10px] font-bold uppercase tracking-widest text-[#d1d5db]"
             >
                <option value="all">Semua Status</option>
                <option value="pending">PENDING</option>
                <option value="verified">VERIFIED</option>
                <option value="rejected">REVISI</option>
             </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-dark-panel rounded-xl border border-dark-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-dark-surface border-b border-dark-border">
              <tr>
                <th className="px-6 py-5 text-[10px] font-bold text-dark-muted uppercase tracking-widest">Nomor Dokumen</th>
                <th className="px-6 py-5 text-[10px] font-bold text-dark-muted uppercase tracking-widest">Pengunggah</th>
                <th className="px-6 py-5 text-[10px] font-bold text-dark-muted uppercase tracking-widest">Tanggal</th>
                <th className="px-6 py-5 text-[10px] font-bold text-dark-muted uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-5 text-[10px] font-bold text-dark-muted uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border text-sm text-[#d1d5db]">
              {loading ? (
                <tr>
                   <td colSpan={5} className="px-6 py-16 text-center text-dark-muted animate-pulse italic">Synchronizing with server...</td>
                </tr>
              ) : filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#121212] transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs text-white leading-none mb-1">{doc.id.substring(0, 8).toUpperCase()}</span>
                        <span className="text-xs text-dark-muted font-medium italic">{doc.title}</span>
                        {doc.feedback && (
                          <span className="text-[10px] text-red-500 flex items-center gap-1 mt-2 font-bold uppercase tracking-tighter">
                             NOTE: {doc.feedback}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-semibold">{doc.uploaderName}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-mono text-dark-muted">{format(doc.createdAt, 'dd MMM yyyy')}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-[9px] font-bold uppercase tracking-[0.2em] border ${
                        doc.status === 'verified' ? 'bg-emerald-900/10 text-emerald-500 border-emerald-900/50' :
                        doc.status === 'rejected' ? 'bg-red-900/10 text-red-500 border-red-900/50' :
                        'bg-amber-900/10 text-amber-500 border-amber-900/50'
                      }`}>
                        {doc.status === 'verified' ? 'VERIFIED' : doc.status === 'rejected' ? 'REVISI' : 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <a 
                        href={doc.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 border border-dark-border text-dark-muted hover:text-white hover:border-gold rounded inline-flex transition-all"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={5} className="px-6 py-16 text-center text-dark-muted italic text-xs">No records found matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="bg-dark-border/30 px-6 py-4 border-t border-dark-border flex items-center justify-between">
           <span className="text-[10px] uppercase tracking-widest text-dark-muted">Menampilkan {filteredDocs.length} dokumen</span>
           <div className="flex gap-4">
              <button disabled className="text-[10px] uppercase tracking-widest text-dark-muted/50 font-bold">Sebelumnya</button>
              <button disabled className="text-[10px] uppercase tracking-widest text-dark-muted/50 font-bold">Selanjutnya</button>
           </div>
        </div>
      </div>
    </div>
  );
}
