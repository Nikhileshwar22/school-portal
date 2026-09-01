import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

/**
 * AcademicChatbot - AI Academic Assistant
 * 
 * A floating chatbot component for students, teachers, and admins.
 * Communicates ONLY with POST /api/chat on the backend.
 * Never stores or sends Gemini API key from the frontend.
 */

const API_BASE = 'http://localhost:5000/api';

const QUICK_QUESTIONS = [
    "How am I performing?",
    "What is my attendance?",
    "Show my marks",
    "What assignments are pending?",
    "Which subject needs improvement?",
    "Create a study plan",
];

const AcademicChatbot = ({ userName = "Student" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: `Hello ${userName} 👋\n\nI can help you understand your academic performance. Ask me about your marks, attendance, assignments, or request a study plan!`
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (text) => {
        const userMessage = text || input.trim();
        if (!userMessage || loading) return;

        // Add user message
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setInput('');
        setLoading(true);

        try {
            const response = await axios.post(
                `${API_BASE}/chat/`,
                { message: userMessage },
                { withCredentials: true }
            );

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.data.message
            }]);
        } catch (error) {
            let errorMsg = "I'm having trouble connecting right now. Please try again.";

            if (error.response?.status === 401) {
                errorMsg = "Your session has expired. Please log in again.";
            } else if (error.response?.status === 429) {
                errorMsg = "You're sending too many messages. Please wait a moment.";
            } else if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            }

            setMessages(prev => [...prev, { role: 'assistant', content: errorMsg, isError: true }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // ── Styles ──────────────────────────────────────────────
    const styles = {
        // Floating button
        toggleBtn: {
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#12355B',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(18, 53, 91, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            zIndex: 9998,
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        },
        // Chat panel
        panel: {
            position: 'fixed',
            bottom: '90px',
            right: '24px',
            width: '400px',
            maxWidth: 'calc(100vw - 48px)',
            height: '560px',
            maxHeight: 'calc(100vh - 120px)',
            borderRadius: '16px',
            background: '#fff',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999,
            overflow: 'hidden',
            border: '1px solid #E2E8F0',
        },
        // Header
        header: {
            padding: '16px 20px',
            background: '#12355B',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        headerTitle: {
            fontSize: '1rem',
            fontWeight: '700',
            margin: 0,
        },
        headerSubtitle: {
            fontSize: '0.75rem',
            opacity: 0.8,
            margin: '2px 0 0',
        },
        closeBtn: {
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            borderRadius: '8px',
            padding: '6px 10px',
            fontSize: '1rem',
        },
        // Messages area
        messagesArea: {
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: '#F8FAFC',
        },
        // Message bubbles
        userBubble: {
            alignSelf: 'flex-end',
            background: '#2563EB',
            color: '#fff',
            padding: '10px 14px',
            borderRadius: '14px 14px 4px 14px',
            maxWidth: '80%',
            fontSize: '0.9rem',
            lineHeight: '1.5',
            wordWrap: 'break-word',
        },
        assistantBubble: {
            alignSelf: 'flex-start',
            background: '#fff',
            color: '#1E293B',
            padding: '10px 14px',
            borderRadius: '14px 14px 14px 4px',
            maxWidth: '85%',
            fontSize: '0.9rem',
            lineHeight: '1.6',
            border: '1px solid #E2E8F0',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
        },
        errorBubble: {
            background: '#FEF2F2',
            border: '1px solid #FEE2E2',
            color: '#DC2626',
        },
        // Quick questions
        quickArea: {
            padding: '12px 16px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            background: '#fff',
        },
        quickBtn: {
            padding: '6px 12px',
            borderRadius: '20px',
            border: '1px solid #E2E8F0',
            background: '#F8FAFC',
            color: '#64748B',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: '500',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
        },
        // Input area
        inputArea: {
            padding: '12px 16px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            background: '#fff',
        },
        input: {
            flex: 1,
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            fontSize: '0.9rem',
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'border-color 0.2s',
        },
        sendBtn: {
            padding: '10px 16px',
            borderRadius: '10px',
            border: 'none',
            background: '#2563EB',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: '600',
            transition: 'background 0.2s',
        },
        // Loading dots
        loadingDots: {
            alignSelf: 'flex-start',
            padding: '10px 14px',
            background: '#fff',
            borderRadius: '14px 14px 14px 4px',
            border: '1px solid #E2E8F0',
            fontSize: '1.2rem',
            letterSpacing: '4px',
            color: '#64748B',
        },
    };

    return (
        <>
            {/* Toggle Button */}
            <button
                style={styles.toggleBtn}
                onClick={() => setIsOpen(!isOpen)}
                title="Academic Assistant"
            >
                {isOpen ? '×' : 'AI'}
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div style={styles.panel}>
                    {/* Header */}
                    <div style={styles.header}>
                        <div>
                            <p style={styles.headerTitle}>Academic Assistant</p>
                            <p style={styles.headerSubtitle}>Powered by AI</p>
                        </div>
                        <button style={styles.closeBtn} onClick={() => setIsOpen(false)}>
                            ×
                        </button>
                    </div>

                    {/* Messages */}
                    <div style={styles.messagesArea}>
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                style={
                                    msg.role === 'user'
                                        ? styles.userBubble
                                        : { ...styles.assistantBubble, ...(msg.isError ? styles.errorBubble : {}) }
                                }
                            >
                                {msg.content}
                            </div>
                        ))}

                        {loading && (
                            <div style={styles.loadingDots}>...</div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Questions (show only at start) */}
                    {messages.length <= 2 && !loading && (
                        <div style={styles.quickArea}>
                            {QUICK_QUESTIONS.map((q, idx) => (
                                <button
                                    key={idx}
                                    style={styles.quickBtn}
                                    onClick={() => sendMessage(q)}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = '#EFF6FF';
                                        e.target.style.borderColor = '#2563EB';
                                        e.target.style.color = '#2563EB';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = '#F8FAFC';
                                        e.target.style.borderColor = '#E2E8F0';
                                        e.target.style.color = '#64748B';
                                    }}
                                >
                                    {q}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div style={styles.inputArea}>
                        <input
                            style={styles.input}
                            type="text"
                            placeholder="Ask about your academics..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                            onFocus={(e) => e.target.style.borderColor = '#2563EB'}
                            onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
                        />
                        <button
                            style={{
                                ...styles.sendBtn,
                                opacity: loading || !input.trim() ? 0.5 : 1,
                                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                            }}
                            onClick={() => sendMessage()}
                            disabled={loading || !input.trim()}
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default AcademicChatbot;
