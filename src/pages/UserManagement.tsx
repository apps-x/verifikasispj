import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile, UserRole } from '../types';
import { 
  Users, 
  Shield, 
  User as UserIcon, 
  Mail, 
  Calendar,
  Search,
  Settings2,
  Check,
  X,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function UserManagement() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || profile.role !== 'admin') return;

    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ ...d.data() } as UserProfile)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const toggleRole = async (user: UserProfile) => {
    if (user.uid === profile?.uid) {
      alert('Anda tidak bisa mengubah peran Anda sendiri demi keamanan.');
      return;
    }

    setUpdatingId(user.uid);
    try {
      const newRole: UserRole = user.role === 'admin' ? 'user' : 'admin';
      await updateDoc(doc(db, 'users', user.uid), {
        role: newRole
      });
    } catch (err) {
      console.error('Failed to update role:', err);
      alert('Gagal memperbarui peran. Pastikan Anda memiliki izin.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <Loader2 className="animate-spin text-gold" size={32} />
      <p className="text-[10px] uppercase tracking-[0.3em] text-dark-muted">Synchronizing Directory</p>
    </div>
  );

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[10px] font-bold text-dark-muted uppercase tracking-[0.3em] mb-1">Access Control</h2>
          <h1 className="text-3xl font-bold text-white uppercase">Manajemen Pengguna</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-muted" size={14} />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-dark-panel border border-dark-border rounded-sm text-xs text-white focus:border-gold outline-none w-full md:w-64 transition-all uppercase tracking-widest placeholder:text-dark-muted/50 font-bold"
          />
        </div>
      </header>

      <div className="bg-dark-panel rounded-sm border border-dark-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-dark-surface border-b border-dark-border">
              <tr>
                <th className="px-6 py-5 text-[10px] font-bold text-dark-muted uppercase tracking-widest">Identitas</th>
                <th className="px-6 py-5 text-[10px] font-bold text-dark-muted uppercase tracking-widest">Kontak</th>
                <th className="px-6 py-5 text-[10px] font-bold text-dark-muted uppercase tracking-widest text-center">Peran Sistem</th>
                <th className="px-6 py-5 text-[10px] font-bold text-dark-muted uppercase tracking-widest">Bergabung</th>
                <th className="px-6 py-5 text-[10px] font-bold text-dark-muted uppercase tracking-widest text-right">Manajemen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.uid} className="hover:bg-[#121212] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-sm bg-dark-surface border border-dark-border flex items-center justify-center text-gold">
                          <UserIcon size={14} />
                        </div>
                        <span className="text-xs font-bold text-white uppercase tracking-tight">{user.displayName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-dark-muted">
                        <Mail size={12} />
                        <span className="text-[10px] font-bold tracking-wider">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-sm text-[9px] font-bold uppercase tracking-[0.2em] border ${
                        user.role === 'admin' 
                          ? 'bg-gold/5 text-gold border-gold/20' 
                          : 'bg-dark-surface text-dark-muted border-dark-border'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] font-bold text-dark-muted uppercase tracking-widest">{format(user.createdAt, 'dd MMM yyyy')}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button
                        onClick={() => toggleRole(user)}
                        disabled={updatingId === user.uid || user.uid === profile?.uid}
                        className={`text-[9px] font-bold uppercase tracking-widest px-4 py-2 rounded-sm border transition-all ${
                          user.role === 'admin'
                            ? 'border-red-900/30 text-red-400 hover:bg-red-400/5'
                            : 'border-gold/30 text-gold hover:bg-gold/5'
                        } disabled:opacity-30 flex items-center gap-2 ml-auto`}
                      >
                        {updatingId === user.uid ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : user.role === 'admin' ? (
                          <ShieldAlert size={10} />
                        ) : (
                          <Shield size={10} />
                        )}
                        <span>{user.role === 'admin' ? 'REVOCATE ADMIN' : 'PROMOTE ADMIN'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-dark-muted italic text-[10px] uppercase tracking-widest">
                    Directory Empty / No Matches Found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-8 bg-dark-panel border border-dark-border rounded-sm space-y-6">
        <div className="flex items-center gap-3 text-gold">
          <Settings2 size={18} />
          <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Kebijakan Keamanan Akun</h3>
        </div>
        <p className="text-[11px] text-dark-muted leading-relaxed max-w-2xl font-medium">
          Untuk menjaga standar keamanan enkripsi tertinggi, administrator tidak diizinkan untuk mengubah kata sandi pengguna secara langsung. Gunakan fitur "Lupa Kata Sandi" pada portal login untuk mengirimkan instruksi pemulihan kode akses yang aman secara langsung ke email terdaftar pengguna.
        </p>
      </div>
    </div>
  );
}
