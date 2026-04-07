import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HeartPulse,
  RotateCcw,
  Send,
  ArrowRight,
  Bot,
  Stethoscope,
  Info,
  CheckCircle2,
  Plus,
  Monitor
} from 'lucide-react';

const App = () => {
  const [view, setView] = useState('welcome'); // welcome, chat, result
  const [name, setName] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [options, setOptions] = useState(null);
  const [result, setResult] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const startDiagnosis = async () => {
    if (!name.trim()) return;
    try {
      const resp = await axios.post('/api/start', { name });
      setSessionId(resp.data.session_id);
      setView('chat');
      setMessages([{ id: 'bot-initial', text: resp.data.message, sender: 'bot' }]);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.message || "Is the backend running?";
      alert(`Failed to start session: ${errorMsg}`);
    }
  };

  const processInput = async (text, additional = {}) => {
    if (!text && !additional.selected_symptom && !additional.input) return;

    const userText = text || additional.selected_symptom?.replace(/_/g, ' ') || additional.input;
    if (userText) {
      setMessages(prev => [...prev, { id: `user-${Date.now()}`, text: userText, sender: 'user' }]);
    }

    setInputValue('');
    setOptions(null);
    setIsTyping(true);

    try {
      const payload = {
        session_id: sessionId,
        input: text || additional.input || "",
        ...additional
      };

      const resp = await axios.post('/api/process', payload);
      const data = resp.data;

      setTimeout(() => {
        setIsTyping(false);
        if (data.message) {
          setMessages(prev => [...prev, { id: `bot-${Date.now()}`, text: data.message, sender: 'bot' }]);
        }

        if (data.state === 'clarifying_symptom') {
          setOptions({ type: 'clarify', matches: data.matches });
        } else if (data.is_yes_no) {
          setOptions({ type: 'yes_no' });
        } else if (data.state === 'finished') {
          setResult(data.result);
          setTimeout(() => setView('result'), 1500);
        }
      }, 800);

    } catch (err) {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: "Sorry, I encountered an error. Please try again.", sender: 'bot' }]);
    }
  };

  const handleReset = () => {
    window.location.reload();
  };

  return (
    <>
      <div className="background-blobs">
        <motion.div
          animate={{ x: [0, 50, 0], y: [0, 100, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="blob blob-1"
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, -100, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="blob blob-2"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="blob blob-3"
        />
      </div>

      <div className="app-container">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.8rem', fontWeight: 700 }}>
            <HeartPulse color="var(--secondary)" size={32} />
            <span>Medi<span style={{ color: 'var(--primary)' }}>Flow</span></span>
          </div>
          <div className="status-indicator glass" style={{ padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="pulse" style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: '50%' }} />
            AI Engine Active
          </div>
        </header>

        <main style={{ flex: 1 }}>
          <AnimatePresence mode="wait">
            {view === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{ textAlign: 'center', maxWidth: 800, margin: '4rem auto' }}
              >
                <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', lineHeight: 1.1 }}>
                  Your Personal AI <span className="gradient-text">Health Assistant</span>
                </h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-dim)', marginBottom: '3rem' }}>
                  Advanced diagnostic analysis powered by machine learning. Get instant insights and precautions based on your symptoms.
                </p>

                <div className="input-card glass" style={{ padding: '2.5rem', maxWidth: 500, margin: '0 auto' }}>
                  <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                      What should I call you?
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && startDiagnosis()}
                      placeholder="Enter your name..."
                      style={{
                        width: '100%',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)',
                        padding: '1rem',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '1rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <button onClick={startDiagnosis} className="primary-btn" style={{ width: '100%' }}>
                    Get Started <ArrowRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {view === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="chat-wrapper glass"
              >
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: 45, height: 45, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bot size={24} color="white" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem' }}>MediFlow AI</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>Online | Diagnostic Mode</p>
                    </div>
                  </div>
                  <button onClick={handleReset} style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
                    <RotateCcw size={20} />
                  </button>
                </div>

                <div className="chat-messages">
                  {messages.map((m) => (
                    <div key={m.id} className={`message ${m.sender}`}>
                      {m.text}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="message bot">
                      <div className="typing-dots">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="input-area">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: options ? '1rem' : 0 }}>
                    {options?.type === 'clarify' && options.matches.map(m => (
                      <button key={m} className="option-btn" onClick={() => processInput(null, { selected_symptom: m })}>
                        {m.replace(/_/g, ' ')}
                      </button>
                    ))}
                    {options?.type === 'yes_no' && (
                      <>
                        <button className="option-btn" onClick={() => processInput('yes')}>Yes</button>
                        <button className="option-btn" onClick={() => processInput('no')}>No</button>
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && processInput(inputValue)}
                      placeholder="Type your response..."
                      style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--glass-border)',
                        padding: '0.8rem 1.2rem',
                        borderRadius: '12px',
                        color: 'white',
                        outline: 'none'
                      }}
                    />
                    <button onClick={() => processInput(inputValue)} style={{ width: 44, height: 44, borderRadius: '12px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'result' && result && (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ maxWidth: 900, margin: '0 auto' }}
              >
                <div className="glass" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{ width: 60, height: 60, background: 'var(--accent)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Stethoscope size={32} color="white" />
                  </div>
                  <h2 style={{ fontSize: '1.8rem' }}>Diagnosis Summary</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="glass"
                    style={{ gridColumn: 'span 2', padding: '2rem' }}
                  >
                    <h3 style={{ color: 'var(--text-dim)', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Potential Diagnosis</h3>
                    <div style={{ background: 'linear-gradient(90deg, var(--primary), var(--secondary))', padding: '0.8rem 1.5rem', borderRadius: '12px', display: 'inline-block', fontSize: '1.5rem', fontWeight: 700, margin: '1rem 0' }}>
                      {result.initial_disease.replace(/_/g, ' ')}
                    </div>
                    <p style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}>{result.description}</p>
                  </motion.div>

                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="glass"
                    style={{ padding: '2rem' }}
                  >
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Condition Assessment</h3>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.8rem',
                      padding: '1rem',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--glass-border)',
                      color: result.condition.includes('consultation') ? 'var(--danger)' : 'var(--accent)'
                    }}>
                      <Info size={20} />
                      <span>{result.condition}</span>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="glass"
                    style={{ padding: '2rem' }}
                  >
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Recommended Precautions</h3>
                    <ul style={{ listStyle: 'none' }}>
                      {result.precautions.map((p, i) => (
                        <li key={i} style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--glass-border)', display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
                          <CheckCircle2 size={18} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
                          <span style={{ fontSize: '0.9rem' }}>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                  {result.mismatch && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="glass"
                      style={{ gridColumn: 'span 2', padding: '2rem', borderLeft: '4px solid var(--secondary)' }}
                    >
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Alternative Consideration</h3>
                      <p style={{ fontSize: '0.95rem' }}>Our SVM model also suggests: <strong style={{ color: 'var(--secondary)' }}>{result.second_prediction.replace(/_/g, ' ')}</strong></p>
                    </motion.div>
                  )}
                </div>

                <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center' }}>
                  <button onClick={handleReset} className="primary-btn" style={{ padding: '1rem 3rem' }}>
                    <Plus size={20} /> Start New Diagnosis
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '4rem', borderTop: '1px solid var(--glass-border)' }}>
          <div className="footer-info">
            <p>Developed by: <strong style={{ color: 'white' }}>ROHITH RAJENDRAN</strong> | Reg No: <strong>23BSCS047</strong></p>
            <p>&copy; 2024 MediFlow AI. For informational purposes only. Always consult a doctor for medical advice.</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default App;
