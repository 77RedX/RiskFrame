import { useState, useRef, useEffect } from 'react';
import { sendAgentMessage } from '../../api';
import './AgentCopilot.css';

const initialMessages = () => [{ role: 'assistant', content: 'I use **Groq AI** and verified application tools to explain risk, optimize baskets and compare dated closing prices. Ask a follow-up to continue the conversation. All account trades remain simulated; I cannot execute orders or change balances.', toolCalls: [] }];
const toolLabels = { optimizePortfolio: 'Portfolio optimization', analyzeRisk: 'Risk assessment', getHistoricalPrices: 'Historical closing prices', getSupportedTickers: 'Supported market universe', getUserPortfolios: 'Your saved strategies' };
const percent = value => Number.isFinite(value) ? `${Number((value * 100).toFixed(2))}%` : 'Not reported';

function ToolResult({ call }) {
  const result = call.result || {};
  return <details className="tool-chip"><summary>{toolLabels[call.tool] || 'Unavailable request'}{result.error ? ' | Unavailable' : ''}</summary>
    <div className="tool-detail">
      {result.error ? <p>{String(result.error)}</p> : <>
        {call.tool === 'optimizePortfolio' && <><p>Engine: {result.engine || 'Not reported'}</p><p>Market data as of: {result.market_data_as_of || 'Not reported'}</p><p>Sharpe: {Number.isFinite(result.metrics?.sharpe_ratio) ? result.metrics.sharpe_ratio.toFixed(2) : 'Not reported'}</p><p>Maximum weight: {percent(result.applied_settings?.max_weight)}</p><p>Risk-free rate: {percent(result.applied_settings?.risk_free_rate)}</p></>}
        {call.tool === 'getHistoricalPrices' && <p>Historical closes as of {result.as_of || result.dates?.at(-1) || 'Not reported'}</p>}
        {call.tool === 'analyzeRisk' && <><p>{result.riskRating}</p><p>Largest allocation: {result.maxConcentration}</p></>}
        {call.tool === 'getSupportedTickers' && <p>{result.tickers?.length ?? 0} supported assets</p>}
        {call.tool === 'getUserPortfolios' && <p>{result.portfolios?.length ?? 0} saved strategies read with your permission</p>}
      </>}
    </div>
  </details>;
}

export default function AgentCopilot({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [includePortfolioContext, setIncludePortfolioContext] = useState(false);
  const [failure, setFailure] = useState(null);
  const messagesEndRef = useRef(null);
  useEffect(() => { if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages, isOpen]);

  const reset = (permission = false) => {
    setSessionId(null); setMessages(initialMessages()); setInput(''); setFailure(null); setIncludePortfolioContext(permission);
  };
  const handleSend = async (textToSend, retry = false) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;
    const past = retry ? messages.slice(0, -1) : messages;
    if (!retry) setMessages(prev => [...prev, { role: 'user', content: text, toolCalls: [] }]);
    setInput(''); setLoading(true); setFailure(null);
    try {
      const response = await sendAgentMessage(text, sessionId, { includePortfolioContext, history: currentUser ? [] : past.slice(1).slice(-12).map(m => ({ role: m.role, content: m.content.slice(0, 4000) })) });
      if (response.sessionId) setSessionId(response.sessionId);
      setMessages(prev => [...prev, { role: 'assistant', content: response.reply, toolCalls: response.toolCalls || [] }]);
    } catch (error) { setFailure({ text, error: error.name === 'TimeoutError' ? 'Copilot request timed out. Please retry.' : error.message }); }
    finally { setLoading(false); }
  };

  return <div className={`agent-copilot-container ${isOpen ? 'open' : ''}`}>
    <button className="agent-toggle-btn" onClick={() => setIsOpen(!isOpen)} title="Toggle Quant Copilot" aria-expanded={isOpen} aria-controls="quant-copilot-drawer"><span className="agent-label">Quant Copilot</span><span className="agent-badge">Groq AI</span></button>
    {isOpen && <aside id="quant-copilot-drawer" aria-label="Quant copilot" className="agent-drawer">
      <div className="agent-drawer-header"><div className="agent-drawer-title"><div><h4>RiskFrame Quant Copilot</h4><span className="agent-status">Groq AI{currentUser ? ` | ${currentUser.name}` : ' | Public market analysis'}</span></div></div>
        <div className="agent-header-actions"><button disabled={loading} onClick={() => reset()} aria-label="Start new conversation">New</button><button aria-label="Close copilot" className="agent-close-btn" onClick={() => setIsOpen(false)}>&times;</button></div>
      </div>
      <div className="agent-privacy"><p>Messages and permitted tool results are sent to Groq. Do not include credentials.</p>
        {currentUser && <label><input type="checkbox" checked={includePortfolioContext} disabled={loading} onChange={e => reset(e.target.checked)} />Allow saved portfolio context with Groq</label>}
      </div>
      <div className="agent-messages-container" aria-busy={loading}>
        {messages.map((m, index) => <div key={index} className={`agent-message ${m.role}`}><div className="agent-message-content"><div className="agent-text" dangerouslySetInnerHTML={{ __html: formatMarkdown(m.content) }} />
          {m.toolCalls?.length > 0 && <div className="agent-tools-executed"><div className="tools-title">Sources &amp; calculations</div>{m.toolCalls.map((call, i) => <ToolResult key={i} call={call} />)}</div>}
        </div></div>)}
        {loading && <div className="agent-message assistant loading"><span role="status" className="agent-loading-text">Waiting for Groq and application tools...</span></div>}
        <div ref={messagesEndRef} />
      </div>
      {failure && <div className="agent-error" role="alert"><p>{failure.error}</p><button onClick={() => handleSend(failure.text, true)} aria-label="Retry message">Retry</button></div>}
      {messages.length === 1 && !loading && <div className="agent-quick-prompts">{['Optimize AAPL, NVDA, and MSFT', 'Explain concentration risk', 'Show my saved portfolios'].map(prompt => <button key={prompt} className="quick-chip" onClick={() => handleSend(prompt)}>{prompt}</button>)}</div>}
      <form className="agent-input-form" onSubmit={e => { e.preventDefault(); handleSend(); }}><input type="text" maxLength={4000} aria-label="Message the copilot" placeholder="Ask about allocations, prices or risk..." value={input} onChange={e => setInput(e.target.value)} disabled={loading} /><button type="submit" disabled={loading || !input.trim()}>Send</button></form>
    </aside>}
  </div>;
}

function formatMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/### (.*?)\n/g, '<h5 style="margin: 8px 0 4px; color: #D4AF37;">$1</h5>')
    .replace(/\n/g, '<br/>');
}
