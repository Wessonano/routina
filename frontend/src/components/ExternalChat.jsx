import { useConversation } from '../hooks/useConversation';
import ConversationView from './ConversationView';

const CONTACT_LABELS = {
  erick: 'Papa',
  elisa: 'Elisa',
  martine: 'Maman',
};

export default function ExternalChat({ contact }) {
  const { messages, loading, send } = useConversation(contact, false);
  const label = CONTACT_LABELS[contact] || contact;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-3">
        <h1 className="text-lg font-bold">Routina — {label}</h1>
        <p className="text-xs text-blue-200">Conversation avec Arnaud</p>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <ConversationView
          messages={messages}
          loading={loading}
          onSend={send}
          selfAuthor={contact}
        />
      </div>
    </div>
  );
}
