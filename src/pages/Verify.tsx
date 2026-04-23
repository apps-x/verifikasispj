import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { SPJDocument } from '../types';
import { handleFirestoreError } from '../lib/utils';
import { 
  FileText, 
  ExternalLink, 
  CheckCircle2, 
  XCircle, 
  Search,
  Filter,
  MessageSquare,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

export default function Verify() {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<SPJDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<SPJDocument | null>(null);
  const [feedback, setFeedback] = useState('');
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || profile.role !== 'admin') {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'documents'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as SPJDocument));
      setDocuments(docs);
      setLoading(false);
      setError(null);
    }, (error) => {
      console.error("Firestore listener error:", error);
      setError(`Gagal memuat data: ${error.message}. Pastikan Anda memiliki hak akses Verifikator.`);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [profile]);

  const handleAction = async (status: 'verified' | 'rejected') => {
    if (!selectedDoc || !profile) return;
    
    setProcessing(true);
    try {
      const docRef = doc(db, 'documents', selectedDoc.id);
      await updateDoc(docRef, {
        status,
        feedback,
        verifiedBy: profile.uid,
        updatedAt: Date.now()
      });

      // Send notification
      await addDoc(collection(db, 'notifications'), {
        userId: selectedDoc.uploadedBy,
        title: `Dokumen ${status === 'verified' ? 'Disetujui' : 'Ditolak'}`,
        message: `SPJ "${selectedDoc.title}" telah ${status === 'verified' ? 'diverifikasi dan disetujui' : 'ditolak'}. ${feedback ? `Alasan: ${feedback}` : ''}`,
        read: false,
        createdAt: Date.now()
      });

      setSelectedDoc(null);
      setFeedback('');
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setProcessing(false);
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.uploaderName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[10px] font-medium text-dark-muted uppercase tracking-[0.3em] mb-1">Audit Queue</h2>
          <h1 className="text-3xl font-bold text-white uppercase">Verifikasi Dokumen</h1>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" size={14} />
          <input 
            type="text" 
            placeholder="Search documents..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-dark-panel border border-dark-border rounded text-xs text-white focus:border-gold outline-none w-full md:w-64 transition-all uppercase tracking-widest placeholder:text-dark-muted/50"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-900/10 border border-red-900/50 p-4 rounded text-red-500 text-[10px] uppercase tracking-widest font-bold flex items-center gap-3">
          <XCircle size={14} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* List */}
        <div className="bg-dark-panel rounded-xl border border-dark-border shadow-sm overflow-hidden h-[calc(100vh-320px)] flex flex-col">
          <div className="px-6 py-4 bg-dark-border/50 border-b border-dark-border font-bold text-[10px] uppercase tracking-widest text-dark-muted flex items-center justify-between">
            <span>Daftar Tunggu</span>
            <Filter size={14} />
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-dark-border">
            {filteredDocs.length > 0 ? (
              filteredDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`w-full p-6 text-left hover:bg-[#121212] transition-colors flex items-center justify-between group ${selectedDoc?.id === doc.id ? 'bg-[#121212]' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 border border-dark-border bg-dark-surface text-gold rounded flex items-center justify-center shrink-0">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm line-clamp-1">{doc.title}</p>
                      <p className="text-[10px] text-dark-muted uppercase tracking-widest mt-0.5">{doc.uploaderName} • {format(doc.createdAt, 'dd/MM/yyyy')}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className={`text-dark-muted group-hover:text-gold transition-colors ${selectedDoc?.id === doc.id ? 'text-gold translate-x-1' : ''}`} />
                </button>
              ))
            ) : (
              <div className="p-12 text-center text-dark-muted italic text-sm">
                No documents in queue.
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="bg-dark-panel rounded-xl border border-dark-border shadow-sm overflow-hidden h-[calc(100vh-320px)] flex flex-col">
          <AnimatePresence mode="wait">
            {selectedDoc ? (
              <motion.div 
                key={selectedDoc.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
              >
                <div className="p-8 border-b border-dark-border">
                  <div className="flex items-start justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white leading-tight">{selectedDoc.title}</h2>
                    <a 
                      href={selectedDoc.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] uppercase tracking-widest font-bold text-gold border border-gold/30 px-4 py-2 rounded hover:bg-gold hover:text-black transition-all flex items-center gap-2"
                    >
                      Buka File <ExternalLink size={12} />
                    </a>
                  </div>
                  <div className="grid grid-cols-2 gap-8 text-[10px] uppercase tracking-widest font-bold text-dark-muted">
                    <div>
                      <p className="mb-1 opacity-50">Pengunggah</p>
                      <p className="text-white">{selectedDoc.uploaderName}</p>
                    </div>
                    <div>
                      <p className="mb-1 opacity-50">Timestamp</p>
                      <p className="text-white">{format(selectedDoc.createdAt, 'dd MMM yyyy, HH:mm')}</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 flex-1 overflow-y-auto space-y-8">
                  <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-dark-muted">Keterangan</p>
                    <div className="p-5 bg-dark-surface/50 border border-dark-border rounded text-sm text-[#9ca3af] italic leading-relaxed">
                      {selectedDoc.description || 'No additional remarks provided.'}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-dark-muted flex items-center gap-2">
                      <MessageSquare size={12} /> Feedback / Evaluation
                    </label>
                    <textarea 
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="Enter evaluative notes or reasons for rejection..."
                      rows={5}
                      className="w-full p-5 bg-dark-surface border border-dark-border rounded text-sm text-white focus:border-gold outline-none transition-all resize-none placeholder:text-dark-muted/50"
                    />
                  </div>
                </div>

                <div className="p-8 bg-dark-surface border-t border-dark-border grid grid-cols-2 gap-6">
                  <button
                    onClick={() => handleAction('rejected')}
                    disabled={processing}
                    className="flex items-center justify-center gap-3 py-4 border border-red-900/50 text-red-500 font-bold text-[10px] uppercase tracking-widest rounded hover:bg-red-900/10 transition-colors disabled:opacity-50"
                  >
                    <XCircle size={14} />
                    Tolak Laporan
                  </button>
                  <button
                    onClick={() => handleAction('verified')}
                    disabled={processing}
                    className="flex items-center justify-center gap-3 py-4 bg-white text-black font-bold text-[10px] uppercase tracking-widest rounded hover:bg-gold transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} />
                    Setujui Berkas
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-12 space-y-6 opacity-30">
                <div className="w-24 h-24 border border-dark-border bg-dark-surface rounded flex items-center justify-center text-dark-muted">
                  <FileText size={48} />
                </div>
                <div>
                  <p className="font-bold text-dark-muted uppercase tracking-[0.2em] text-[10px]">Pilih dokumen untuk ditinjau</p>
                  <p className="text-xs italic text-dark-muted/50 mt-2">Gunakan panel di sebelah kiri untuk melihat detail berkas SPJ.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
