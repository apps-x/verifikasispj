import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Notification } from '../types';
import { Bell, Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function NotificationBell() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingDocsCount, setPendingDocsCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  
  const totalAlertCount = notifications.filter(n => !n.read).length + (profile?.role === 'admin' ? pendingDocsCount : 0);

  useEffect(() => {
    if (!profile) return;
    
    // Auth-based notifications (for everyone)
    const qNotifications = query(
      collection(db, 'notifications'), 
      where('userId', '==', profile.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    
    const unsubscribeNotifications = onSnapshot(qNotifications, (snapshot) => {
      setNotifications(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
    }, (error) => {
      console.error("Notifications listener error:", error);
    });

    // Admin pending documents counter
    let unsubscribePending: (() => void) | null = null;
    if (profile.role === 'admin') {
      const qPending = query(collection(db, 'documents'), where('status', '==', 'pending'));
      unsubscribePending = onSnapshot(qPending, (snapshot) => {
        setPendingDocsCount(snapshot.size);
      });
    }

    return () => {
      unsubscribeNotifications();
      if (unsubscribePending) unsubscribePending();
    };
  }, [profile]);

  const markAllAsRead = async () => {
    for (const n of notifications) {
      if (!n.read) {
        await updateDoc(doc(db, 'notifications', n.id), { read: true });
      }
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && notifications.filter(n => !n.read).length > 0) markAllAsRead();
        }}
        className="relative p-2 text-dark-muted hover:text-white transition-colors"
      >
        <Bell size={18} />
        {totalAlertCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-dark-panel"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-80 bg-dark-panel rounded border border-dark-border shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-dark-border bg-dark-surface/50 flex items-center justify-between">
                <span className="font-bold text-[10px] uppercase tracking-widest text-[#d1d5db]">Notifikasi</span>
                {totalAlertCount > 0 && <span className="text-[9px] bg-gold text-black px-2 py-0.5 rounded font-bold uppercase">{totalAlertCount} BARU</span>}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {profile?.role === 'admin' && pendingDocsCount > 0 && (
                  <div className="p-5 border-b border-dark-border bg-dark-surface hover:bg-[#121212] transition-colors border-l-2 border-l-gold">
                    <div className="flex gap-4">
                      <div className="mt-0.5 w-2 h-2 rounded-full shrink-0 bg-gold animate-pulse"></div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white uppercase tracking-tight">Menunggu Verifikasi</p>
                        <p className="text-[11px] text-[#9ca3af] leading-relaxed mt-1">Terdapat {pendingDocsCount} dokumen baru yang perlu segera Anda periksa.</p>
                      </div>
                    </div>
                  </div>
                )}
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div key={n.id} className={`p-5 border-b border-dark-border last:border-0 hover:bg-[#121212] transition-colors ${!n.read ? 'bg-gold/5' : ''}`}>
                      <div className="flex gap-4">
                        <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${n.title.includes('Disetujui') ? 'bg-emerald-500' : 'bg-red-500'}`}>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-white leading-tight uppercase tracking-tight">{n.title}</p>
                          <p className="text-[11px] text-[#9ca3af] line-clamp-3 leading-relaxed mt-1">{n.message}</p>
                          <p className="text-[10px] font-mono text-dark-muted mt-2">{format(n.createdAt, 'dd MMM, HH:mm', { locale: id })}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center text-dark-muted text-[10px] uppercase tracking-widest italic">
                    Inbox Empty.
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
