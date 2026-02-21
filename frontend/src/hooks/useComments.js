import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

export function useComments(date) {
  const [comments, setComments] = useState([]);
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const [data, unreadData] = await Promise.all([
        api.getComments(date),
        api.commentsUnread(date),
      ]);
      setComments(data);
      setUnread(unreadData.count);
    } catch {
      setComments([]);
      setUnread(0);
    }
  }, [date]);

  useEffect(() => { refresh(); }, [refresh]);

  // Poll for new comments every 30s
  useEffect(() => {
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const reply = async (message, replyTo) => {
    const created = await api.postComment({ date, message, replyTo });
    setComments((prev) => [...prev, created]);
    return created;
  };

  const markRead = async () => {
    await api.commentsMarkRead(date);
    setUnread(0);
  };

  return { comments, unread, refresh, reply, markRead };
}
