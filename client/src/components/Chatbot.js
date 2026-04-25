import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Sparkles } from 'lucide-react';
import '../styles/Chatbot.css';

const SUGGESTIONS = [
  "How does UniGear work?",
  "How to rent an item?",
  "How to list a micro-task?",
  "Is the platform secure?",
  "What's the trust score?"
];

const FormattedText = ({ text }) => {
  if (!text) return null;
  
  const lines = text.split('\n');
  return lines.map((line, i) => {
    let parts = line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    if (line.trim().startsWith('* ')) {
      return <li key={i} className="cb-list-item">{parts.slice(1)}</li>;
    }

    return <p key={i}>{parts}</p>;
  });
};

const Chatbot = ({ closeChat }) => {
  const [messages, setMessages] = useState([
    { 
      from: 'bot', 
      text: "Hello! I'm **UniGear Assistant**. I can help you rent equipment or earn between classes. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = { 
      from: 'user', 
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const response = await fetch(`http://localhost:5002/api/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) throw new Error('Chatbot error');

      const data = await response.json();
      const botMessage = { 
        from: 'bot', 
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages((prev) => [...prev, { 
        from: 'bot', 
        text: "I'm having trouble connecting. Let's try again in a moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chatbot-window">
      <div className="chatbot-header">
        <div className="cb-header-left">
          <div className="cb-status-dot"></div>
          <h3>UniGear Assistant</h3>
        </div>
        <button onClick={closeChat} className="chatbot-close-btn" aria-label="Close">
          <X size={18} />
        </button>
      </div>

      <div className="cb-messages-area">
        {messages.map((msg, i) => (
          <div key={i} className={`cb-message ${msg.from}`}>
            <div className="cb-message-content">
              <FormattedText text={msg.text} />
            </div>
            <span className="cb-timestamp">{msg.timestamp}</span>
          </div>
        ))}
        {isLoading && (
          <div className="cb-message bot">
            <div className="cb-typing-indicator">
              <div className="cb-dot"></div>
              <div className="cb-dot"></div>
              <div className="cb-dot"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showSuggestions && (
        <div className="cb-suggestions-section">
          <div className="cb-suggestions-title">
            <Sparkles size={14} />
            <span>Suggested Topics</span>
          </div>
          <div className="cb-suggestions-grid">
            {SUGGESTIONS.map((suggestion, i) => (
              <button
                key={i}
                className="cb-suggestion-chip"
                onClick={() => handleSendMessage(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        className="cb-input-area"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(input);
        }}
      >
        <div className="cb-input-wrapper">
          <input
            type="text"
            className="cb-input-field"
            placeholder="How can I help you?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <button type="submit" className="cb-send-btn" disabled={isLoading}>
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
