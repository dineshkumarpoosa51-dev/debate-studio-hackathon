import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import {
  Send,
  RefreshCcw,
  ArrowLeft
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:8001';

function App() {
  const [step, setStep] = useState('welcome'); // welcome, viewpoint, debate
  const [topic, setTopic] = useState('');
  const [viewpoint, setViewpoint] = useState('');
  const [suggestedTopics, setSuggestedTopics] = useState([]);
  const [history, setHistory] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/suggested-topics`);
        setSuggestedTopics(res.data.topics);
      } catch (err) {
        console.error("Failed to fetch topics", err);
      }
    };
    fetchTopics();
  }, []);

  const startDebate = async () => {
    if (!topic || !viewpoint) return;
    setStep('debate');
    setIsLoading(true);

    // Add user's initial viewpoint to history visually
    const initialUserMsg = { role: 'user', content: viewpoint };
    setHistory([initialUserMsg]);

    try {
      const res = await axios.post(`${API_BASE_URL}/debate`, {
        topic,
        initial_viewpoint: viewpoint,
        history: []
      });

      setHistory(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (err) {
      console.error("Debate error", err);
      setHistory(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error connecting to my neural core. Please ensure the backend is running and the GROQ_API_KEY is set." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMsg = { role: 'user', content: inputText };
    setHistory(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await axios.post(`${API_BASE_URL}/debate`, {
        topic,
        initial_viewpoint: viewpoint,
        history: [...history, userMsg]
      });

      setHistory(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (err) {
      console.error("Chat error", err);
      setHistory(prev => [...prev, { role: 'assistant', content: "Failed to generate counter-argument. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicSelect = (t) => {
    setTopic(t);
    setStep('viewpoint');
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.25rem' }}>
          <RefreshCcw size={24} />
          Debate Studio
        </div>
        {step !== 'welcome' && (
          <button
            onClick={() => {
              setStep('welcome');
              setHistory([]);
              setTopic('');
              setViewpoint('');
            }}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          >
            New Debate
          </button>
        )}
      </header>

      <div className="main-content">
        <AnimatePresence mode="wait">
          {/* Welcome Screen */}
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="welcome-container"
            >
              <div>
                <h1 className="welcome-title">
                  Challenge Your Ideas<br />
                  Sharpen Your Arguments
                </h1>
                <p className="welcome-subtitle">
                  Engage in intelligent debates with AI. Choose a topic or create your own.
                </p>
              </div>

              <div className="topics-grid">
                {suggestedTopics.map((t, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="topic-card"
                    onClick={() => handleTopicSelect(t)}
                  >
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>{t}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Click to start debating</p>
                  </motion.div>
                ))}
              </div>

              <div style={{ width: '100%', maxWidth: '600px', display: 'flex', gap: '1rem' }}>
                <input
                  className="custom-input"
                  placeholder="Or enter your own topic..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && topic && setStep('viewpoint')}
                />
                <button
                  onClick={() => topic && setStep('viewpoint')}
                  className="btn btn-primary"
                  disabled={!topic}
                >
                  Start
                </button>
              </div>
            </motion.div>
          )}

          {/* Viewpoint Screen */}
          {step === 'viewpoint' && (
            <motion.div
              key="viewpoint"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="welcome-container"
            >
              <div style={{ maxWidth: '700px', width: '100%' }}>
                <button
                  onClick={() => setStep('welcome')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <ArrowLeft size={16} /> Back to topics
                </button>

                <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>{topic}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                  Define your position on this topic. The AI will take the opposing view.
                </p>

                <textarea
                  className="custom-input"
                  placeholder="Enter your viewpoint and arguments..."
                  value={viewpoint}
                  onChange={(e) => setViewpoint(e.target.value)}
                  style={{ minHeight: '200px', resize: 'vertical', marginBottom: '1.5rem' }}
                />

                <button
                  onClick={startDebate}
                  disabled={!viewpoint.trim() || isLoading}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  {isLoading ? (
                    <RefreshCcw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    'Start Debate'
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Debate Screen */}
          {step === 'debate' && (
            <motion.div
              key="debate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="chat-container"
            >
              <div className="chat-header">
                <h2>{topic}</h2>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Round {Math.ceil(history.length / 2)}
                </div>
              </div>

              <div className="chat-messages">
                {history.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`message ${msg.role === 'user' ? 'message-user' : 'message-ai'}`}
                  >
                    <div className="message-label">
                      {msg.role === 'user' ? 'You' : 'AI Opponent'}
                    </div>
                    <div>{msg.content}</div>
                  </motion.div>
                ))}

                {isLoading && (
                  <div className="message message-ai">
                    <div className="typing-indicator">
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                      <div className="typing-dot"></div>
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              <div className="chat-input-container">
                <textarea
                  className="chat-input"
                  placeholder="Type your response..."
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  rows={1}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !inputText.trim()}
                  className="send-btn"
                >
                  <Send size={20} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default App;
