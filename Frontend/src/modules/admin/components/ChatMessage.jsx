import React from 'react';
import { FileIcon, Download, Check, CheckCheck, Clock } from 'lucide-react';
import { format } from 'date-fns';

const ChatMessage = ({ message, isOwnMessage }) => {
    const { sender, content, status, createdAt } = message;

    const renderContent = () => {
        switch (content.type) {
            case 'text':
                return <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{content.text}</p>;
            
            case 'image':
                return (
                    <div className="space-y-2">
                        <img 
                            src={content.fileUrl} 
                            alt="Attachment" 
                            className="max-w-full rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => window.open(content.fileUrl, '_blank')}
                        />
                        {content.text && <p className="text-sm">{content.text}</p>}
                    </div>
                );

            case 'file':
                return (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg border border-white/20">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                <FileIcon size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate">{content.fileName}</p>
                                <p className="text-[10px] opacity-70">
                                    {content.fileSize ? `${(content.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                                </p>
                            </div>
                            <a 
                                href={content.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <Download size={18} />
                            </a>
                        </div>
                        {content.text && <p className="text-sm">{content.text}</p>}
                    </div>
                );

            default:
                return <p className="text-sm italic opacity-70">Unsupported message type: {content.type}</p>;
        }
    };

    return (
        <div className={`flex w-full mb-6 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] lg:max-w-[70%] ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                
                {/* Avatar */}
                {!isOwnMessage && (
                    <div className="flex-shrink-0 mt-auto">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-sm ${
                            sender.userType === 'Admin' ? 'bg-indigo-600' : (sender.userType === 'SpareDriver' ? 'bg-amber-500' : 'bg-blue-600')
                        }`}>
                            {sender.avatar ? (
                                <img src={sender.avatar} alt={sender.name} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                                <span>{sender.name?.charAt(0).toUpperCase()}</span>
                            )}
                        </div>
                    </div>
                )}

                {/* Message Bubble */}
                <div className="flex flex-col gap-1">
                    {/* Sender Name */}
                    {!isOwnMessage && (
                        <span className="text-[11px] font-bold text-slate-500 px-1 uppercase tracking-wider">
                            {sender.name} • {sender.userType}
                        </span>
                    )}

                    <div className={`relative px-4 py-3 rounded-2xl shadow-sm ${
                        isOwnMessage 
                            ? 'bg-blue-600 text-white rounded-tr-none' 
                            : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                    }`}>
                        {renderContent()}

                        {/* Footer info inside bubble */}
                        <div className={`flex items-center justify-end gap-1.5 mt-1 opacity-70`}>
                            <span className="text-[10px] font-medium">
                                {createdAt ? format(new Date(createdAt), 'HH:mm') : format(new Date(), 'HH:mm')}
                            </span>
                            
                            {isOwnMessage && (
                                <div className="flex">
                                    {status === 'read' ? (
                                        <CheckCheck size={12} className="text-blue-100" />
                                    ) : (
                                        <Check size={12} className="text-blue-100" />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatMessage;
