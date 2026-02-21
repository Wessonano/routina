import { useState } from 'react';

const AUTHOR_COLORS = {
  erick: 'bg-blue-100 text-blue-800',
  elisa: 'bg-pink-100 text-pink-800',
  martine: 'bg-purple-100 text-purple-800',
  arnaud: 'bg-gray-100 text-gray-800',
};

const AUTHOR_LABELS = {
  erick: 'Erick',
  elisa: 'Elisa',
  martine: 'Martine',
  arnaud: 'Arnaud',
};

export default function Comments({ comments, onReply, onClose }) {
  const [replyText, setReplyText] = useState('');
  const [replyTo, setReplyTo] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onReply(replyText.trim(), replyTo);
    setReplyText('');
    setReplyTo(null);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           className="w-full max-w-lg mx-auto bg-white rounded-t-2xl p-4 max-h-[70vh] flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-900">Commentaires</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl leading-none">&times;</button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-3">
          {comments.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-4">
              Aucun commentaire pour ce jour
            </p>
          )}
          {comments.map((c) => (
            <div key={c.id} className={`rounded-lg p-3 ${c.author === 'arnaud' ? 'ml-8' : 'mr-8'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${AUTHOR_COLORS[c.author] || AUTHOR_COLORS.arnaud}`}>
                  {AUTHOR_LABELS[c.author] || c.author}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(c.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-gray-800">{c.message}</p>
              {c.author !== 'arnaud' && (
                <button onClick={() => setReplyTo(c.id)}
                        className="text-xs text-blue-600 mt-1 cursor-pointer">
                  Repondre
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Reply form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1">
            {replyTo && (
              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                Reponse a #{replyTo}
                <button type="button" onClick={() => setReplyTo(null)} className="text-red-400 cursor-pointer">x</button>
              </div>
            )}
            <input type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)}
                   placeholder="Ecrire un message..."
                   className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium cursor-pointer">
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );
}
