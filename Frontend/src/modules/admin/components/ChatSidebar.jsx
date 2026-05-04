import React, { useState, useEffect } from 'react';
import { Search, User, Car, MessageCircle, MoreVertical, Filter, Check, CheckCheck, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAPI } from '../../../utils/adminApi';
import { socketService } from '../../../utils/socket';
import { formatDistanceToNow } from 'date-fns';

/**
 * ─── ADMIN CHAT SIDEBAR (PHASE 5 REFINEMENT) ───────────────────────
 * Dense, industrial list of support sessions with real-time updates.
 */

const ChatSidebar = ({ activeRoomId, onSelectRoom }) => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('active');

    const fetchRooms = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getChatRooms({ status: filter === 'all' ? undefined : filter });
            if (response.status === 'success') {
                setRooms(response.rooms);
            }
        } catch (error) {
            console.error('Error fetching chat rooms:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();

        const socket = socketService.getSocket();
        if (!socket) return;

        const onNewRoom = (newRoom) => setRooms(prev => [newRoom, ...prev]);
        const onNewMsg = ({ roomId, message }) => {
            setRooms(prev => prev.map(room => {
                if (room._id === roomId) {
                    return {
                        ...room,
                        lastMessage: {
                            text: message.content.text || `Sent a ${message.content.type}`,
                            sender: message.sender.userId,
                            timestamp: message.createdAt
                        },
                        unreadCount: room._id === activeRoomId ? 0 : (room.unreadCount || 0) + 1,
                        updatedAt: message.createdAt
                    };
                }
                return room;
            }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
        };

        socket.on('new_chat_room', onNewRoom);
        socket.on('new_message', onNewMsg);

        return () => {
            socket.off('new_chat_room', onNewRoom);
            socket.off('new_message', onNewMsg);
        };
    }, [activeRoomId, filter]);

    const filteredRooms = rooms.filter(room => {
        const participantNames = room.participants.map(p => p.name || '').join(' ').toLowerCase();
        return participantNames.includes(searchQuery.toLowerCase());
    });

    return (
        <div className="flex flex-col h-full bg-white border-r border-slate-100 w-full lg:w-[380px]">
            {/* Header */}
            <div className="p-5 border-b border-slate-50 bg-white">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-lg font-black text-slate-800 tracking-tight">Transmission Feed</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Support Operations</p>
                    </div>
                    <button onClick={fetchRooms} className="p-2 text-slate-400 hover:text-slate-800 transition-colors">
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="Search IDs or names..."
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 mt-4">
                    {['active', 'closed', 'all'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                filter === f 
                                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Room List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading && rooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 opacity-20">
                        <MessageCircle size={32} />
                        <p className="text-[10px] font-black uppercase tracking-widest">Synchronizing...</p>
                    </div>
                ) : filteredRooms.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                        {filteredRooms.map((room) => {
                            const other = room.participants.find(p => p.userType !== 'Admin') || room.participants[0];
                            const isActive = activeRoomId === room._id;
                            const unreadCount = room.unreadCount || 0;

                            return (
                                <motion.div
                                    key={room._id}
                                    onClick={() => onSelectRoom(room._id)}
                                    className={`p-4 flex gap-3 cursor-pointer transition-all relative hover:bg-slate-50/80 ${
                                        isActive ? 'bg-blue-50/50' : ''
                                    }`}
                                >
                                    {isActive && <div className="absolute left-0 top-2 bottom-2 w-1 bg-blue-600 rounded-r-full shadow-[0_0_10px_rgba(37,99,235,0.5)]" />}

                                    <div className="relative flex-shrink-0">
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-sm ${
                                            other.userType === 'SpareDriver' ? 'bg-amber-500' : 'bg-blue-600'
                                        }`}>
                                            {other.avatar ? (
                                                <img src={other.avatar} alt={other.name} className="w-full h-full object-cover rounded-2xl" />
                                            ) : (
                                                <span>{other.name?.charAt(0).toUpperCase()}</span>
                                            )}
                                        </div>
                                        {room.status === 'active' && (
                                            <div className="absolute -right-0.5 -bottom-0.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-green-500 shadow-sm" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h3 className={`text-xs font-black truncate ${isActive ? 'text-blue-900' : 'text-slate-800'}`}>
                                                {other.name}
                                            </h3>
                                            <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">
                                                {room.updatedAt ? formatDistanceToNow(new Date(room.updatedAt), { addSuffix: false }) : ''}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={`text-[11px] truncate flex-1 leading-tight ${
                                                unreadCount > 0 ? 'font-black text-slate-900' : 'text-slate-400 font-medium'
                                            }`}>
                                                {room.lastMessage?.text || 'Establishing connection...'}
                                            </p>
                                            
                                            {unreadCount > 0 && (
                                                <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg min-w-[18px] text-center shadow-lg shadow-blue-200">
                                                    {unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-1.5 mt-2">
                                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter ${
                                                other.userType === 'SpareDriver' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                            }`}>
                                                {other.userType === 'SpareDriver' ? 'Driver' : 'User'}
                                            </span>
                                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">#{room._id.slice(-6)}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4 opacity-30 grayscale">
                        <MessageCircle size={32} className="animate-pulse" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No Active Channels</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatSidebar;
