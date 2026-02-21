import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useConversation(contact, isAdmin) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const contactRef = useRef(contact);
  contactRef.current = contact;

  const refresh = useCallback(async () => {
    try {
      const data = await api.getConversation(contact);
      if (contactRef.current === contact) {
        setMessages(data);
      }
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [contact]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  // Poll every 30s
  useEffect(() => {
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const send = async (message, replyToId) => {
    if (isAdmin) {
      const created = await api.postComment({
        date: todayStr(),
        message,
        targetContact: contact,
        replyTo: replyToId || undefined,
      });
      setMessages((prev) => [...prev, created]);
      return created;
    } else {
      const created = await api.postExternalMessage(contact, message);
      setMessages((prev) => [...prev, created]);
      return created;
    }
  };

  const markRead = useCallback(async () => {
    if (isAdmin) {
      await api.markReadByContact(contact);
    }
  }, [contact, isAdmin]);

  return { messages, loading, refresh, send, markRead };
}
