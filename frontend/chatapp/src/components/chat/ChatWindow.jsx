import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, MoreVertical, Phone, Menu } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

export const ChatWindow = ({
  currentUser,
  selectedContact,
  messages,
  isLoading,
  onSendMessage,
  isOtherTyping,
  onTyping,
  onOpenSidebar,
}) => {
  const [draft, setDraft] = useState('');
  const isTypingLocalRef = useRef(false);
  const idleTimerRef = useRef(null);

  useEffect(() => {
    // Reset local typing state when switching conversations
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = null;
    isTypingLocalRef.current = false;
    if (onTyping) onTyping(false);
    setDraft('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContact?._id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!draft.trim() || !onSendMessage) return;
    onSendMessage(draft);
    setDraft('');
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = null;
    isTypingLocalRef.current = false;
    if (onTyping) onTyping(false);
  };

  const headerInitials = useMemo(() => {
    if (!selectedContact) return '';
    const name = selectedContact.name || selectedContact.email || '';
    const [first = '', second = ''] = name.split(' ');
    return (first[0] || '') + (second[0] || '');
  }, [selectedContact]);

  return (
    <div className="flex-1 flex flex-col h-screen bg-gradient-to-r from-blue-300 via-blue-100 to-gray-300">
      <div className="p-4 border-b bg-blue-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="md:hidden mr-1 p-1 rounded-full text-slate-600 hover:bg-blue-200"
            onClick={onOpenSidebar}
          >
            <Menu size={20} />
          </button>
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
            {selectedContact ? headerInitials || 'U' : '?'}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">
              {selectedContact
                ? selectedContact.name || selectedContact.email
                : 'No conversation selected'}
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              {selectedContact
                ? 'Messages are delivered via the backend API'
                : 'Choose a contact from the left to start chatting'}
            </p>
          </div>
        </div>
        <div className="flex gap-4 text-slate-400">
          <Phone
            size={20}
            className="cursor-pointer hover:text-indigo-600 transition-colors"
          />
          <MoreVertical
            size={20}
            className="cursor-pointer hover:text-indigo-600 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {!selectedContact && (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            Select a contact to view your conversation.
          </div>
        )}

        {selectedContact && isLoading && (
          <div className="text-center text-xs text-slate-400">
            Loading messages...
          </div>
        )}

        {selectedContact &&
          !isLoading &&
          messages.map((m) => {
            const isOwn =
              currentUser &&
              (m.sender?._id === currentUser.id ||
                m.sender === currentUser.id);
            const createdAt = m.createdAt
              ? new Date(m.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';

            const status =
              isOwn && m.readAt ? 'read' : isOwn ? 'sent' : undefined;

            return (
              <MessageBubble
                key={m._id}
                text={m.message}
                time={createdAt}
                isOwn={isOwn}
                status={status}
              />
            );
          })}

        {selectedContact && !isLoading && messages.length === 0 && (
          <div className="text-center text-xs text-slate-400 mt-4">
            No messages yet. Say hello!
          </div>
        )}

        {selectedContact && isOtherTyping && (
          <TypingIndicator name={selectedContact.name || selectedContact.email} />
        )}
      </div>

      <div className="p-4 bg-gradient-to-r from-gray-300 via-blue-100 to-blue-300 border-t">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 bg-white p-2 rounded-2xl"
        >
          <input
            type="text"
            placeholder={
              selectedContact ? 'Type a message...' : 'Select a contact first'
            }
            value={draft}
            onChange={(e) => {
              const value = e.target.value;
              setDraft(value);
              if (!onTyping || !selectedContact) return;

              // Emit "typing: true" once when user starts typing
              const shouldBeTyping = Boolean(value);
              if (shouldBeTyping && !isTypingLocalRef.current) {
                isTypingLocalRef.current = true;
                onTyping(true);
              }

              // Emit "typing: false" when input is cleared
              if (!shouldBeTyping && isTypingLocalRef.current) {
                isTypingLocalRef.current = false;
                onTyping(false);
              }

              // Auto-stop after idle
              if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
              if (shouldBeTyping) {
                idleTimerRef.current = setTimeout(() => {
                  isTypingLocalRef.current = false;
                  onTyping(false);
                }, 1200);
              } else {
                idleTimerRef.current = null;
              }
            }}
            disabled={!selectedContact}
            className="flex-1 bg-transparent border-none focus:ring-0 px-2 text-sm disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!selectedContact || !draft.trim()}
            className="bg-green-600 p-2 rounded-xl text-white hover:bg-green-700 transition-all active:scale-90 disabled:opacity-60 disabled:active:scale-100"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};