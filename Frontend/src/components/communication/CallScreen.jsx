import React, { useState, useEffect } from 'react';
import { useVoiceCall } from '../../hooks/useVoiceCall';
import './CallScreen.css';

const CallScreen = ({ callId, bookingId, isIncoming, onEnd }) => {
    const { call, answerCall, rejectCall, endCall } = useVoiceCall(bookingId);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);

    useEffect(() => {
        let interval;
        if (call?.status === 'connected') {
            interval = setInterval(() => {
                setDuration((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [call?.status]);

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswer = async () => {
        await answerCall(callId);
    };

    const handleReject = async () => {
        await rejectCall(callId);
        onEnd();
    };

    const handleEnd = async () => {
        await endCall(callId);
        onEnd();
    };

    const getCallStatus = () => {
        if (!call) return 'Connecting...';
        switch (call.status) {
            case 'initiated':
            case 'ringing':
                return isIncoming ? 'Incoming call...' : 'Calling...';
            case 'connected':
                return formatDuration(duration);
            default:
                return 'Call ended';
        }
    };

    const getCallerName = () => {
        if (!call) return '';
        return isIncoming ? call.caller.name : call.receiver.name;
    };

    const getMaskedPhone = () => {
        if (!call) return '';
        return isIncoming ? call.caller.maskedPhone : call.receiver.maskedPhone;
    };

    return (
        <div className="call-screen">
            <div className="call-info">
                <div className="caller-avatar">
                    {getCallerName().charAt(0).toUpperCase()}
                </div>
                <h2 className="caller-name">{getCallerName()}</h2>
                <p className="caller-phone">{getMaskedPhone()}</p>
                <p className="call-status">{getCallStatus()}</p>
            </div>

            <div className="call-controls">
                {call?.status === 'connected' && (
                    <>
                        <button
                            className={`control-btn ${isMuted ? 'active' : ''}`}
                            onClick={() => setIsMuted(!isMuted)}
                        >
                            <span className="control-icon">{isMuted ? '🔇' : '🔊'}</span>
                            <span className="control-label">Mute</span>
                        </button>

                        <button
                            className={`control-btn ${isSpeaker ? 'active' : ''}`}
                            onClick={() => setIsSpeaker(!isSpeaker)}
                        >
                            <span className="control-icon">🔊</span>
                            <span className="control-label">Speaker</span>
                        </button>
                    </>
                )}
            </div>

            <div className="call-actions">
                {isIncoming && call?.status !== 'connected' ? (
                    <>
                        <button className="call-btn answer-btn" onClick={handleAnswer}>
                            <span className="btn-icon">📞</span>
                            <span>Answer</span>
                        </button>
                        <button className="call-btn reject-btn" onClick={handleReject}>
                            <span className="btn-icon">📵</span>
                            <span>Reject</span>
                        </button>
                    </>
                ) : (
                    <button className="call-btn end-btn" onClick={handleEnd}>
                        <span className="btn-icon">📞</span>
                        <span>End Call</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default CallScreen;
