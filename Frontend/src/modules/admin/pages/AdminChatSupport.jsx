import React, { useState, useEffect, useCallback } from 'react';
import ChatSidebar from '../components/ChatSidebar';
import ChatWindow from '../components/ChatWindow';
import { 
    MessageSquare, ShieldAlert, Clock, CheckCircle2, 
    ChevronLeft, LifeBuoy, Zap, TrendingUp, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../../utils/adminApi';
import { socketService } from '../../../utils/socket';
import { toast } from 'react-hot-toast';

/**
 * ─── ADMIN CHAT SUPPORT (PHASE 5 WIRING) ───────────────────────────
 * Mission control for real-time customer and driver support.
 */

const AdminChatSupport = () => {
    const [selectedRoomId, setSelectedRoomId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentAdmin, setCurrentAdmin] = useState(null);
    const [stats, setStats] = useState({ active: 0, resolved: 0, avgResponse: '0s' });

    // Fetch profile and stats
    useEffect(() => {
        const initSupport = async () => {
            try {
                const [profRes, statsRes] = await Promise.all([
                    adminAPI.getProfile(),
                    adminAPI.getSupportStats().catch(() => ({ data: { active: 0, resolved: 0 } }))
                ]);
                
                if (profRes.status === 'success') {
                    setCurrentAdmin(profRes.data.admin);
                    const token = localStorage.getItem('auth_admin_token');
                    if (token) socketService.connect(token);
                }
                
                if (statsRes.status === 'success') {
                    setStats(statsRes.data);
                }
            } catch (error) {
                console.error('Support Initialization Error:', error);
            }
        };
        initSupport();
    }, []);

    const fetchMessages = useCallback(async (roomId) => {
        try {
            setLoading(true);
            const response = await adminAPI.getChatMessages(roomId, { limit: 50 });
            if (response.status === 'success') {
                setMessages(response.messages.reverse());
            }
        } catch (error) {
            toast.error('Failed to load transmission history');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSelectRoom = (roomId) => {
        if (selectedRoomId) socketService.emit('leave_chat_room', { roomId: selectedRoomId });
        setSelectedRoomId(roomId);
        setMessages([]);
        fetchMessages(roomId);
        socketService.emit('join_chat_room', { roomId });
        adminAPI.markChatAsRead(roomId).catch(console.error);
    };

    const handleSendMessage = async (content) => {
        try {
            await adminAPI.sendChatMessage(selectedRoomId, content);
        } catch (error) {
            toast.error('Transmission failed');
        }
    };

    useEffect(() => {
        const socket = socketService.getSocket();
        if (!socket) return;

        const onNewMessage = ({ roomId, message }) => {
            if (roomId === selectedRoomId) {
                setMessages(prev => [...prev, message]);
                adminAPI.markChatAsRead(roomId).catch(console.error);
                socketService.emit('mark_as_read', { roomId });
            }
        };

        const onUserTyping = ({ userId, userName, roomId }) => {
            if (roomId === selectedRoomId) {
                setTypingUsers(prev => prev.find(u => u.id === userId) ? prev : [...prev, { id: userId, name: userName }]);
            }
        };

        const onUserStoppedTyping = ({ userId, roomId }) => {
            if (roomId === selectedRoomId) setTypingUsers(prev => prev.filter(u => u.id !== userId));
        };

        socket.on('new_message', onNewMessage);
        socket.on('user_typing', onUserTyping);
        socket.on('user_stopped_typing', onUserStoppedTyping);

        return () => {
            socket.off('new_message', onNewMessage);
            socket.off('user_typing', onUserTyping);
            socket.off('user_stopped_typing', onUserStoppedTyping);
        };
    }, [selectedRoomId]);

    return (
        <div className="space-y-6 pb-4">
            {/* Page Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                    <MessageSquare size={22} />
                </div>
                <div>
                    <h1 className="text-xl font-black text-slate-800 uppercase tracking-tight">Chat Support</h1>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Real-time customer & driver support</p>
                </div>
                {/* Live Stats */}
                <div className="ml-auto hidden md:flex items-center gap-3">
                    {[
                        { label: 'Active', val: stats.active || 0, color: 'text-blue-600 bg-blue-50' },
                        { label: 'Resolution', val: '98.2%', color: 'text-emerald-600 bg-emerald-50' },
                        { label: 'Avg Response', val: stats.avgResponse || '<30s', color: 'text-amber-600 bg-amber-50' },
                    ].map(s => (
                        <div key={s.label} className={`${s.color} rounded-2xl px-4 py-2 text-center`}>
                            <p className="text-[8px] font-black uppercase tracking-widest opacity-70">{s.label}</p>
                            <p className="text-sm font-black">{s.val}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Container */}
            <div className="flex h-[calc(100vh-200px)] min-h-[500px] bg-white overflow-hidden rounded-[2rem] border border-slate-100 shadow-sm">
                {/* Sidebar */}
                <div className={`${selectedRoomId ? 'hidden lg:block' : 'block'} w-full lg:w-[360px] xl:w-[400px] shrink-0 border-r border-slate-100`}>
                    <ChatSidebar activeRoomId={selectedRoomId} onSelectRoom={handleSelectRoom} />
                </div>

                {/* Main Stage */}
                <div className={`flex-1 flex flex-col relative bg-white ${!selectedRoomId ? 'hidden lg:flex' : 'flex'}`}>
                    {selectedRoomId ? (
                        <>
                            <div className="lg:hidden px-4 py-3 bg-white border-b border-slate-100 flex items-center gap-3">
                                <button onClick={() => setSelectedRoomId(null)} className="p-1.5 hover:bg-slate-100 rounded-xl"><ChevronLeft size={18} /></button>
                                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Live Support Session</h3>
                            </div>
                            <ChatWindow 
                                roomId={selectedRoomId} 
                                messages={messages} 
                                onSendMessage={handleSendMessage}
                                typingUsers={typingUsers}
                                currentUserId={currentAdmin?._id || currentAdmin?.id}
                            />
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gradient-to-br from-slate-50 to-white">
                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative mb-10">
                                <div className="w-32 h-32 bg-blue-50 rounded-[2rem] flex items-center justify-center">
                                    <LifeBuoy size={56} className="text-blue-500 animate-pulse" />
                                </div>
                                <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
                                    className="absolute -top-3 -right-3 w-10 h-10 bg-amber-500 text-slate-900 rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
                                    <Zap size={18} fill="currentColor" />
                                </motion.div>
                            </motion.div>
                            <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                                <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">Support Control Tower</h2>
                                <p className="text-sm text-slate-400 font-medium max-w-md mx-auto">Select a chat session from the sidebar to begin monitoring and responding to support requests.</p>
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminChatSupport;
