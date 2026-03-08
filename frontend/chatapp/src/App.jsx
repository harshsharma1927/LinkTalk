import { useRef, useState, useEffect } from 'react';
import { AuthForm } from './components/auth/AuthForm';
import { Sidebar } from './components/chat/Sidebar';
import { ChatWindow } from './components/chat/ChatWindow';
import { apiFetch } from './api';
import { connectSocket, disconnectSocket, getSocket } from './socket';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [typingByUserId, setTypingByUserId] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastMessageByUserId, setLastMessageByUserId] = useState({});
  const typingTimersRef = useRef({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    apiFetch('/auth/me')
      .then((res) => {
        setCurrentUser(res?.data?.user || null);
        setIsAuthenticated(true);
        connectSocket(token);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setCurrentUser(null);
      });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const socket = getSocket();
    if (!socket) return;

    const handleReceiveMessage = (message) => {
      if (!message?._id) return;
      if (!currentUser) return;

      const senderId = message?.sender?._id || message?.sender;
      const receiverId = message?.receiver?._id || message?.receiver;
      if (!senderId || !receiverId) return;

      // Track last message for sidebar (incoming or outgoing)
      const otherPartyId = senderId === currentUser.id ? receiverId : senderId;
      const timeLabel = message.createdAt
        ? new Date(message.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
        : '';

      setLastMessageByUserId((prev) => ({
        ...prev,
        [otherPartyId]: {
          preview: typeof message.message === 'string' ? message.message : '',
          time: timeLabel,
        },
      }));

      // Only append to the open conversation; otherwise count as unread notification
      const openOtherId = selectedContact?._id || null;
      const isOpenConversation =
        openOtherId &&
        ((senderId === openOtherId && receiverId === currentUser.id) ||
          (senderId === currentUser.id && receiverId === openOtherId));

      if (isOpenConversation) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });

        // If the other user sent it and we're viewing the conversation, mark read
        if (senderId === openOtherId && receiverId === currentUser.id) {
          socket.emit('markRead', { withUserId: openOtherId });
        }
      } else {
        // Only show notifications for messages received by the current user
        if (receiverId === currentUser.id) {
          setUnreadCounts((prev) => ({
            ...prev,
            [senderId]: (prev[senderId] || 0) + 1,
          }));
        }
      }
    };

    const handleTyping = ({ fromUserId, isTyping }) => {
      if (!fromUserId) return;

      if (typingTimersRef.current[fromUserId]) {
        clearTimeout(typingTimersRef.current[fromUserId]);
        delete typingTimersRef.current[fromUserId];
      }

      setTypingByUserId((prev) => ({
        ...prev,
        [fromUserId]: Boolean(isTyping),
      }));

      // Safety: if "stop typing" never arrives, auto-clear soon
      if (isTyping) {
        typingTimersRef.current[fromUserId] = setTimeout(() => {
          setTypingByUserId((prev) => ({ ...prev, [fromUserId]: false }));
          delete typingTimersRef.current[fromUserId];
        }, 1500);
      }
    };

    const handleMessagesRead = ({ messageIds, readAt }) => {
      if (!Array.isArray(messageIds) || messageIds.length === 0) return;
      setMessages((prev) =>
        prev.map((m) =>
          messageIds.includes(m._id)
            ? { ...m, readAt: m.readAt || readAt || new Date().toISOString() }
            : m
        )
      );
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('typing', handleTyping);
    socket.on('messagesRead', handleMessagesRead);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('typing', handleTyping);
      socket.off('messagesRead', handleMessagesRead);
    };
  }, [isAuthenticated, currentUser, selectedContact]);

  useEffect(() => {
    if (!isAuthenticated) return;

    apiFetch('/messages/users/list')
      .then((res) => {
        setContacts(res?.data?.users || []);
      })
      .catch(() => {
        setContacts([]);
      });
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !selectedContact) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    apiFetch(`/messages/${selectedContact._id}`)
      .then((res) => {
        setMessages(res?.data?.messages || []);
      })
      .then(() =>
        apiFetch(`/messages/${selectedContact._id}/read`, { method: 'POST' }).catch(
          () => { }
        )
      )
      .catch(() => {
        setMessages([]);
      })
      .finally(() => setIsLoadingMessages(false));

    // Clear unread badge and also trigger socket read-receipt update for the sender
    setUnreadCounts((prev) => {
      if (!selectedContact?._id) return prev;
      if (!prev[selectedContact._id]) return prev;
      return { ...prev, [selectedContact._id]: 0 };
    });
    const socket = getSocket();
    if (socket && selectedContact?._id) {
      socket.emit('markRead', { withUserId: selectedContact._id });
    }
  }, [isAuthenticated, selectedContact]);

  const handleAuthSuccess = (user, token) => {
    if (token) {
      localStorage.setItem('token', token);
      connectSocket(token);
    }
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setContacts([]);
    setSelectedContact(null);
    setMessages([]);
    setTypingByUserId({});
    setUnreadCounts({});
    setLastMessageByUserId({});
    Object.values(typingTimersRef.current).forEach((t) => clearTimeout(t));
    typingTimersRef.current = {};
    disconnectSocket();
  };

  const handleSendMessage = async (text) => {
    if (!text.trim() || !selectedContact) return;

    try {
      const res = await apiFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({
          receiverId: selectedContact._id,
          message: text.trim(),
        }),
      });

      const newMessage = res?.data?.message;
      if (newMessage) {
        setMessages((prev) => [...prev, newMessage]);
        setLastMessageByUserId((prev) => ({
          ...prev,
          [selectedContact._id]: {
            preview:
              typeof newMessage.message === 'string'
                ? newMessage.message
                : text.trim(),
            time: newMessage.createdAt
              ? new Date(newMessage.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
              : '',
          },
        }));
      }
    } catch {
      // Silently fail for now; could surface a toast/alert
    }
  };

  const handleTyping = (isTyping) => {
    if (!selectedContact) return;
    const socket = getSocket();
    if (!socket) return;
    socket.emit('typing', { receiverId: selectedContact._id, isTyping });
  };

  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-center bg-cover"
        style={{
          backgroundImage: "url('src/assets/linktalk_logo_animation.gif')",
          backgroundPosition: "center 47%"
        }}
      >
        <AuthForm mode="login" onAuthenticated={handleAuthSuccess} />
      </div>
    );
  }

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    if (!contact?._id) return;
    setUnreadCounts((prev) => ({ ...prev, [contact._id]: 0 }));
    const socket = getSocket();
    if (socket) socket.emit('markRead', { withUserId: contact._id });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      <div className="hidden md:block w-80 border-r border-black">
        <div className="p-6 flex items-center justify-between">
          <div>
            <div className="font-bold text-3xl text-blue-600">LinkTalk</div>
            {currentUser && (
              <div className="text-x text-slate-400 mt-1">
                Hey {currentUser.name || currentUser.email}
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="text-[13px] text-slate-400 underline hover:text-slate-600"
          >
            Logout
          </button>
        </div>
        <Sidebar
          contacts={contacts}
          selectedContactId={selectedContact?._id || null}
          onSelectContact={handleSelectContact}
          unreadCounts={unreadCounts}
          lastMessageByUserId={lastMessageByUserId}
        />
      </div>
      <ChatWindow
        currentUser={currentUser}
        selectedContact={selectedContact}
        messages={messages}
        isLoading={isLoadingMessages}
        onSendMessage={handleSendMessage}
        isOtherTyping={Boolean(
          selectedContact && typingByUserId[selectedContact._id]
        )}
        onTyping={handleTyping}
      />
    </div>
  );
}