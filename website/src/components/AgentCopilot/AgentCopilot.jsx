import { useState, useRef, useEffect } from 'react';
import { sendAgentMessage } from '../../api';
import './AgentCopilot.css';

export default function AgentCopilot({ currentUser, onSelectTickers }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        '👋 Hi! I am your **RiskFrame Quantitative Co-Pilot**.\n\nI can analyze your portfolios, optimize custom stock baskets with our PyTorch Temporal CNN model, and assess risk trade-offs.',
      toolCalls: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text, toolCalls: [] };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendAgentMessage(text, sessionId);
      if (res.sessionId) setSessionId(res.sessionId);

      const assistantMsg = {
        role: 'assistant',
        content: res.reply,
        toolCalls: res.toolCalls || [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Error executing agent reasoning: ${err.message}`,
          toolCalls: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Optimize AAPL, NVDA, and MSFT',
    'Build a tech basket with defensive GLD hedge',
    'Show my saved portfolios',
    'Explain Ledoit-Wolf shrinkage risk',
  ];

  return (
    <div className={`agent-copilot-container ${isOpen ? 'open' : ''}`}>
      {/* Floating Toggle Button */}
      <button
        className="agent-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Toggle Quantitative AI Co-Pilot"
      >
        <span className="agent-icon">🤖</span>
        <span className="agent-label">AI Quant Co-Pilot</span>
        <span className="agent-badge">Agentic v2</span>
      </button>

      {/* Slide-out Agent Window */}
      {isOpen && (
        <div className="agent-drawer">
          <div className="agent-drawer-header">
            <div className="agent-drawer-title">
              <span className="agent-avatar">🤖</span>
              <div>
                <h4>RiskFrame AI Co-Pilot</h4>
                <span className="agent-status">
                  {currentUser ? `Signed in as ${currentUser.name}` : 'Autonomous Quant Agent'}
                </span>
              </div>
            </div>
            <button className="agent-close-btn" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          <div className="agent-messages-container">
            {messages.map((m, idx) => (
              <div key={idx} className={`agent-message ${m.role}`}>
                <div className="agent-message-content">
                  <div className="agent-text" dangerouslySetInnerHTML={{ __html: formatMarkdown(m.content) }} />
                  {m.toolCalls && m.toolCalls.length > 0 && (
                    <div className="agent-tools-executed">
                      <div className="tools-title">⚡ Tools Executed:</div>
                      {m.toolCalls.map((t, tIdx) => (
                        <div key={tIdx} className="tool-chip">
                          <span className="tool-name">{t.tool}</span>
                          {t.tool === 'optimizePortfolio' && (
                            <span className="tool-detail">
                              Max Sharpe: {t.result?.metrics?.sharpe_ratio?.toFixed(2)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="agent-message assistant loading">
                <div className="agent-loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="agent-loading-text">Analyzing market dynamics & optimizing weights...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="agent-quick-prompts">
            {quickPrompts.map((p, i) => (
              <button key={i} className="quick-chip" onClick={() => handleSend(p)}>
                {p}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <form
            className="agent-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              placeholder="Ask anything or request portfolio allocation..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function formatMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/### (.*?)\n/g, '<h5 style="margin: 8px 0 4px; color: #D4AF37;">$1</h5>')
    .replace(/\n/g, '<br/>');
}
