import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

export default function ChatPanel({ fileId }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I've analyzed your dataset. Ask me anything — trends, outliers, specific columns, or what the numbers mean.",
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const sendMessage = async (text) => {
    const q = (text || input).trim();
    if (!q || loading) return;

    const newMessages = [...messages, { role: 'user', content: q }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const history = newMessages.slice(1).map(m => ({ role: m.role, content: m.content }));
      const { data } = await axios.post(`/api/chat/${fileId}`, { question: q, history });
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I couldn't process that. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    "What are the top 3 findings?",
    "Which column has the most outliers?",
    "What correlations exist?",
    "Any concerning patterns?",
  ];

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        title="Ask about your data"
        style={{
          position: 'fixed', bottom: 28, right: 28,
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
          border: 'none', color: 'white', fontSize: 22,
          cursor: 'pointer', boxShadow: '0 4px 24px rgba(99,102,241,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, transition: 'all 0.2s ease',
          transform: open ? 'scale(0.95)' : 'scale(1)',
        }}
      >
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div style={{
          position: 'fixed', bottom: 96, right: 24,
          width: 400, height: 540,
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 20,
          boxShadow: '0 20px 64px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column',
          zIndex: 200, animation: 'fadeUp 0.25s ease',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border)',
            background: 'rgba(99,102,241,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32,
                background: 'linear-gradient(135deg, var(--primary), var(--accent2))',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
              }}>🧠</div>
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>Ask Your Data</p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Claude Haiku · Fast responses</p>
              </div>
            </div>
            <button onClick={() => setMessages([messages[0]])} title="Clear chat"
              style={{ background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', fontSize: 16 }}>
              🗑
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'assistant' && (
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--primary), var(--accent2))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, marginRight: 8, marginTop: 2,
                  }}>🧠</div>
                )}
                <div style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? 'var(--primary)' : 'var(--surface)',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                  fontSize: 13, lineHeight: 1.6,
                  color: msg.role === 'user' ? 'white' : 'var(--text)',
                }}>
                  {msg.role === 'assistant' ? (
                    <div className="chat-markdown">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p style={{ margin: '0 0 6px 0', lineHeight: 1.6 }}>{children}</p>,
                          strong: ({ children }) => <strong style={{ color: 'var(--accent)', fontWeight: 700 }}>{children}</strong>,
                          ul: ({ children }) => <ul style={{ paddingLeft: 18, margin: '6px 0' }}>{children}</ul>,
                          li: ({ children }) => <li style={{ marginBottom: 4 }}>{children}</li>,
                          code: ({ children }) => (
                            <code style={{
                              background: 'var(--bg2)', padding: '2px 6px', borderRadius: 4,
                              fontSize: 12, fontFamily: 'monospace', color: 'var(--accent2)',
                            }}>{children}</code>
                          ),
                        }}
                      >{msg.content}</ReactMarkdown>
                    </div>
                  ) : msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--accent2))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
                }}>🧠</div>
                <div style={{ display: 'flex', gap: 4, padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px 16px 16px 4px' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: 'var(--primary)',
                      animation: `pulse-ring 1s ${i * 0.18}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggested questions */}
          {messages.length === 1 && (
            <div style={{ padding: '4px 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {suggestedQuestions.map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)} style={{
                  padding: '4px 10px',
                  background: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: 100, color: 'var(--primary-light)',
                  fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-body)',
                  transition: 'all 0.15s',
                }}
                  onMouseOver={e => e.target.style.background = 'rgba(99,102,241,0.2)'}
                  onMouseOut={e => e.target.style.background = 'rgba(99,102,241,0.1)'}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '10px 14px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask anything about your data..."
              style={{
                flex: 1, padding: '10px 14px',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 10, color: 'var(--text)', fontSize: 13,
                fontFamily: 'var(--font-body)', outline: 'none',
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                width: 40, height: 40,
                background: input.trim() && !loading ? 'var(--primary)' : 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10, color: 'white',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                fontSize: 16, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              {loading ? '…' : '→'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
