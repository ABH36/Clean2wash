import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile, Image as ImageIcon, FileText, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMessage from './ChatMessage';
import { adminAPI } from '../../../utils/adminApi';
import { socketService } from '../../../utils/socket';
import { toast } from 'react-hot-toast';

const ChatWindow = ({ roomId, messages, onSendMessage, typingUsers, currentUserId }) => {
    const [inputValue, setInputValue] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [attachments, setAttachments] = useState([]);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, typingUsers]);

    const handleSend = async () => {
        if (!inputValue.trim() && attachments.length === 0) return;

        const content = {
            type: 'text',
            text: inputValue.trim()
        };

        // If there are attachments, we handle them
        // For simplicity in this version, if there's an attachment, we send it as a separate message or first message
        if (attachments.length > 0) {
            const att = attachments[0]; // Take first for now
            content.type = att.fileType.startsWith('image/') ? 'image' : 'file';
            content.fileUrl = att.url;
            content.fileName = att.fileName;
            content.fileSize = att.fileSize;
            content.fileType = att.fileType;
            content.text = inputValue.trim();
        }

        onSendMessage(content);
        setInputValue('');
        setAttachments([]);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', file);

            const response = await adminAPI.uploadChatFile(formData);
            if (response.status === 'success') {
                setAttachments([response.data]);
                toast.success('File uploaded successfully');
            }
        } catch (error) {
            console.error('File upload error:', error);
            toast.error('Failed to upload file');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleTyping = (e) => {
        setInputValue(e.target.value);
        if (e.target.value.length > 0) {
            socketService.emit('typing_start', { roomId });
        } else {
            socketService.emit('typing_stop', { roomId });
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
                <AnimatePresence>
                    {messages.map((msg, index) => (
                        <motion.div
                            key={msg._id || index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChatMessage 
                                message={msg} 
                                isOwnMessage={msg.sender.userId === currentUserId} 
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Typing Indicator */}
                <AnimatePresence>
                    {typingUsers.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2 mb-4"
                        >
                            <div className="flex gap-1 bg-white border border-slate-100 px-3 py-2 rounded-full shadow-sm">
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">
                                {typingUsers[0].name} is typing...
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-slate-200 p-4 lg:p-6">
                
                {/* Attachment Preview */}
                <AnimatePresence>
                    {attachments.length > 0 && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mb-4 flex"
                        >
                            <div className="relative bg-slate-50 border border-slate-200 rounded-xl p-2 pr-10 flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                    {attachments[0].fileType.startsWith('image/') ? <ImageIcon size={20} /> : <FileText size={20} />}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold truncate max-w-[200px]">{attachments[0].fileName}</p>
                                    <p className="text-[10px] text-slate-500 uppercase">Ready to send</p>
                                </div>
                                <button 
                                    onClick={() => setAttachments([])}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full text-slate-400"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-end gap-3 max-w-6xl mx-auto">
                    <div className="flex-1 relative">
                        <textarea
                            rows={1}
                            placeholder="Type your message here..."
                            className="w-full bg-slate-100 border-none rounded-2xl py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none resize-none custom-scrollbar"
                            value={inputValue}
                            onChange={handleTyping}
                            onKeyDown={handleKeyPress}
                            style={{ minHeight: '44px', maxHeight: '120px' }}
                        />
                        <div className="absolute right-2 bottom-1.5 flex items-center gap-1">
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="p-2 text-slate-500 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
                            >
                                {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Paperclip size={20} />}
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                className="hidden" 
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleSend}
                        disabled={(!inputValue.trim() && attachments.length === 0) || isUploading}
                        className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                    >
                        <Send size={20} />
                    </button>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
};

export default ChatWindow;
