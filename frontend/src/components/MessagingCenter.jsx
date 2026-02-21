import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useConversation } from '../hooks/useConversation';
import ConversationView from './ConversationView';

const TABS = [
  { key: 'erick', label: 'Papa' },
  { key: 'elisa', label: 'Elisa' },
  { key: 'martine', label: 'Maman' },
];

function TabConversation({ contact, isActive }) {
  const { messages, loading, send, markRead } = useConversation(contact, true);

  useEffect(() => {
    if (isActive) markRead();
  }, [isActive, markRead]);

  if (!isActive) return null;

  return (
    <ConversationView
      messages={messages}
      loading={loading}
      onSend={send}
      selfAuthor="arnaud"
    />
  );
}

export default function MessagingCenter({ onClose }) {
  const [activeTab, setActiveTab] = useState('erick');
  const [unreadCounts, setUnreadCounts] = useState({});

  const fetchUnread = useCallback(async () => {
    try {
      const results = await Promise.all(
        TABS.map(async (tab) => {
          const data = await api.unreadByContact(tab.key);
          return [tab.key, data.count];
        })
      );
      setUnreadCounts(Object.fromEntries(results));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // Clear unread badge when switching tab
  useEffect(() => {
    setUnreadCounts((prev) => ({ ...prev, [activeTab]: 0 }));
  }, [activeTab]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Messages</h2>
        <button
          onClick={onClose}
          className="text-gray-400 text-2xl leading-none cursor-pointer"
        >
          &times;
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 text-sm font-medium text-center relative cursor-pointer ${
              activeTab === tab.key
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            }`}
          >
            {tab.label}
            {(unreadCounts[tab.key] || 0) > 0 && (
              <span className="absolute top-1 right-1/4 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {unreadCounts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Conversation */}
      <div className="flex-1 overflow-hidden">
        {TABS.map((tab) => (
          <div key={tab.key} className={`h-full ${activeTab === tab.key ? '' : 'hidden'}`}>
            <TabConversation contact={tab.key} isActive={activeTab === tab.key} />
          </div>
        ))}
      </div>
    </div>
  );
}
