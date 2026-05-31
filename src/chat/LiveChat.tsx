import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useChatConnection, type ChatMsg } from './useChatConnection';
import './LiveChat.css';

export default function LiveChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [activeName, setActiveName] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'Admin';
  const senderName = user ? user.username : activeName;
  const { connected, messages, sendMessage } = useChatConnection(senderName, isAdmin);

  // Auto-set name for logged-in users
  useEffect(() => {
    if (user) setActiveName(user.username);
  }, [user]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || !connected) return;
    sendMessage(trimmed);
    setInput('');
  };

  const handleGuestJoin = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = guestName.trim();
    if (trimmed) setActiveName(trimmed);
  };

  const formatTime = (sentAt: string) => {
    const d = new Date(sentAt);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const needsGuestName = !user && !activeName;

  return (
    <div className="live-chat-wrapper">
      <button className="live-chat-toggle" onClick={() => setOpen(!open)} title="Live Chat">
        <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
        </svg>
        Live Chat
      </button>
      {!open ? null : (
      <div className="live-chat-panel">
      <div className="live-chat-header">
        <div>
          Live Chat
          {connected && <span className="live-chat-status"> &bull; Online</span>}
        </div>
        <button onClick={() => setOpen(false)}>&times;</button>
      </div>

      {needsGuestName ? (
        <form className="live-chat-guest-form" onSubmit={handleGuestJoin}>
          <p>Enter your name to join the chat</p>
          <input
            type="text"
            placeholder="Your name"
            value={guestName}
            onChange={e => setGuestName(e.target.value)}
            autoFocus
            maxLength={50}
          />
          <button type="submit" disabled={!guestName.trim()}>Join Chat</button>
        </form>
      ) : (
        <>
          <div className="live-chat-messages">
            {messages.map((msg: ChatMsg) => {
              const isSelf = msg.senderName === senderName;
              const cls = ['live-chat-msg'];
              if (isSelf) cls.push('self');
              if (msg.isAdmin) cls.push('admin');
              return (
                <div key={msg.chatMessageId} className={cls.join(' ')}>
                  <span className="live-chat-msg-sender">
                    {msg.senderName}{msg.isAdmin ? ' (Staff)' : ''}
                  </span>
                  <span className="live-chat-msg-text">{msg.text}</span>
                  <span className="live-chat-msg-time">{formatTime(msg.sentAt)}</span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          <form className="live-chat-input-area" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              autoFocus
              maxLength={1000}
            />
            <button type="submit" disabled={!connected || !input.trim()}>Send</button>
          </form>
        </>
      )}
    </div>
      )}
    </div>
  );
}
