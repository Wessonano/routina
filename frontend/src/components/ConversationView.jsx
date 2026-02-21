import { useState, useEffect, useRef, useMemo } from 'react';

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return time;
  return `${d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} ${time}`;
}

function truncate(str, max = 80) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export default function ConversationView({ messages, loading, onSend, selfAuthor }) {
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Index messages by id for fast parent lookup
  const messagesById = useMemo(() => {
    const map = {};
    for (const m of messages) map[m.id] = m;
    return map;
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim(), replyTo?.id);
    setText('');
    setReplyTo(null);
  };

  const handleReply = (msg) => {
    setReplyTo({ id: msg.id, author: msg.author, message: msg.message });
    inputRef.current?.focus();
  };

  const isSelf = (msg) => msg.author === selfAuthor;

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading && (
          <p className="text-center text-gray-400 text-sm py-4">Chargement...</p>
        )}
        {!loading && messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-4">Aucun message</p>
        )}
        {messages.map((msg) => {
          const parent = msg.replied_to ? messagesById[msg.replied_to] : null;
          return (
            <div key={msg.id} className={`flex ${isSelf(msg) ? 'justify-end' : 'justify-start'} group`}>
              <div className="flex items-end gap-1 max-w-[75%]">
                {/* Reply button for other person's messages */}
                {!isSelf(msg) && (
                  <button
                    onClick={() => handleReply(msg)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 mb-2 p-1 cursor-pointer"
                    title="Répondre"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M7.793 2.232a.75.75 0 01-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 010 10.75H10.75a.75.75 0 010-1.5h2.875a3.875 3.875 0 000-7.75H3.622l4.146 3.957a.75.75 0 01-1.036 1.085l-5.5-5.25a.75.75 0 010-1.085l5.5-5.25a.75.75 0 011.06.025z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                <div className={`rounded-2xl px-3 py-2 ${
                  isSelf(msg)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}>
                  {/* Quoted parent message */}
                  {parent && (
                    <div className={`text-xs rounded px-2 py-1 mb-1 border-l-2 ${
                      isSelf(msg)
                        ? 'bg-blue-600 border-blue-300 text-blue-100'
                        : 'bg-gray-300 border-gray-400 text-gray-600'
                    }`}>
                      <span className="font-medium">{parent.author}</span>
                      <p className="truncate">{truncate(parent.message, 60)}</p>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  <p className={`text-[10px] mt-1 ${
                    isSelf(msg) ? 'text-blue-100' : 'text-gray-400'
                  }`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
                {/* Reply button for self messages (on the right) */}
                {isSelf(msg) && (
                  <button
                    onClick={() => handleReply(msg)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600 mb-2 p-1 cursor-pointer"
                    title="Répondre"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M7.793 2.232a.75.75 0 01-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 010 10.75H10.75a.75.75 0 010-1.5h2.875a3.875 3.875 0 000-7.75H3.622l4.146 3.957a.75.75 0 01-1.036 1.085l-5.5-5.25a.75.75 0 010-1.085l5.5-5.25a.75.75 0 011.06.025z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply bar */}
      {replyTo && (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 flex items-center gap-2">
          <div className="flex-1 min-w-0 border-l-2 border-blue-400 pl-2">
            <p className="text-xs font-medium text-blue-600">{replyTo.author}</p>
            <p className="text-xs text-gray-500 truncate">{truncate(replyTo.message, 100)}</p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 px-4 py-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrire un message..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium cursor-pointer"
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}
