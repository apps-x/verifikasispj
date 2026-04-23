import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { Upload as UploadIcon, File, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { handleFirestoreError } from '../lib/utils';

export default function Upload() {
  const { profile, driveToken, connectDrive } = useAuth();
  const navigate = useNavigate();
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const [uploadStep, setUploadStep] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !profile) {
      setError('Harap isi semua bidang dan pilih berkas.');
      return;
    }

    if (!driveToken) {
      setError('Harap hubungkan akun Google Drive Anda terlebih dahulu melalui tombol di atas.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadStep('Menyiapkan transmisi Google Drive...');

    try {
      // 1. Upload to Google Drive via multipart POST
      setUploadStep('Sedang mengunggah ke Google Drive...');
      
      const metadata = {
        name: `${Date.now()}_${file.name}`,
        mimeType: file.type,
        description: `SPJ: ${title}. ${description}`
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      form.append('file', file);

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${driveToken}`
        },
        body: form
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error('Sesi Google Drive berakhir. Harap hubungkan kembali akun Anda melalui tombol di atas.');
        }
        throw new Error(`Google Drive API Error: ${errorData.error?.message || 'Gagal menyimpan ke Drive'}`);
      }

      const driveFile = await response.json();
      const downloadURL = driveFile.webViewLink;

      // 2. Save to Firestore (keep metadata in DB for verification tracking)
      setUploadStep('Menyimpan metadata laporan...');
      try {
        await addDoc(collection(db, 'documents'), {
          title,
          description: description || '',
          fileUrl: downloadURL,
          driveFileId: driveFile.id,
          uploadedBy: profile.uid,
          uploaderName: profile.displayName || profile.email || 'User',
          status: 'pending',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      } catch (fsErr: any) {
        handleFirestoreError(fsErr, 'create', 'documents');
      }

      setUploadStep('Selesai!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Upload failed final catch:', err);
      if (err.message && err.message.startsWith('{')) {
        try {
          const errorInfo = JSON.parse(err.message);
          setError(`Kesalahan Firestore: ${errorInfo.error}`);
        } catch (e) {
          setError(`Kesalahan saat simpan data: ${err.message}`);
        }
      } else {
        setError(err.message || 'Gagal memproses dokumen.');
      }
    } finally {
      setIsUploading(false);
      setUploadStep('');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[10px] font-medium text-dark-muted uppercase tracking-[0.3em] mb-1">Documentation</h2>
          <h1 className="text-3xl font-bold text-white uppercase">Unggah Berkas ke Drive</h1>
        </div>
        {!driveToken && (
          <button 
            type="button"
            onClick={connectDrive}
            className="flex items-center gap-2 bg-gold/10 text-gold border border-gold/30 px-5 py-3 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-gold hover:text-black transition-all shadow-lg"
          >
            Hubungkan ke Google Drive
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-dark-panel p-8 rounded-xl border border-dark-border shadow-sm space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-widest font-bold text-dark-muted block">Judul Laporan</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: SPJ Perjalanan Dinas Januari 2024"
              className="w-full bg-dark-surface px-5 py-4 rounded-lg border border-dark-border text-white focus:border-gold outline-none transition-all placeholder:text-dark-muted/50 text-sm"
              required
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-widest font-bold text-dark-muted block">Keterangan Tambahan</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tambahkan detail singkat mengenai dokumen ini..."
              rows={4}
              className="w-full bg-dark-surface px-5 py-4 rounded-lg border border-dark-border text-white focus:border-gold outline-none transition-all resize-none placeholder:text-dark-muted/50 text-sm"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] uppercase tracking-widest font-bold text-dark-muted block">Lampiran Berkas</label>
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative border border-dashed rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer transition-all
                ${isDragging ? 'border-gold bg-gold/5' : 'border-dark-border hover:border-gold/50'}
                ${file ? 'border-emerald-500 bg-emerald-500/5' : ''}
              `}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
              />
              
              <AnimatePresence mode="wait">
                {file ? (
                  <motion.div 
                    key="file-selected"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 bg-emerald-950/20 text-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-4 border border-emerald-900/50">
                      <Check size={32} />
                    </div>
                    <p className="font-medium text-white text-sm">{file.name}</p>
                    <p className="text-[10px] text-dark-muted uppercase mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="mt-6 text-[10px] text-red-400 uppercase tracking-widest hover:underline flex items-center gap-1 mx-auto"
                    >
                      <X size={12} /> Ganti Berkas
                    </button>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="no-file"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                  >
                    <div className="w-16 h-16 bg-dark-surface text-dark-muted rounded-full flex items-center justify-center mx-auto mb-4 border border-dark-border">
                      <UploadIcon size={28} />
                    </div>
                    <p className="font-medium text-white text-sm">Tarik berkas ke sini atau klik untuk pilih</p>
                    <p className="text-[10px] text-dark-muted uppercase tracking-widest mt-2">PDF, JPG, atau PNG (Maks. 5MB)</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-red-950/20 border border-red-900/50 text-red-500 p-4 rounded flex items-center gap-3 text-xs uppercase tracking-widest font-bold"
            >
              <AlertCircle size={14} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={isUploading || !file || !title}
          className={`
            w-full py-5 rounded font-bold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all
            ${isUploading ? 'bg-dark-panel text-dark-muted cursor-not-allowed border border-dark-border' : 'bg-white text-black hover:bg-gold shadow-lg'}
          `}
        >
          {isUploading ? (
            <>
              <Loader2 className="animate-spin" size={14} />
              <span>{uploadStep}</span>
            </>
          ) : (
            <>
              <Check size={14} />
              <span>Simpan Dokumen & Jalankan Prosedur</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
