export const Sidebar = ({
  contacts,
  selectedContactId,
  onSelectContact,
  unreadCounts = {},
  lastMessageByUserId = {},
}) => {
  return (
    <div className="w-full md:w-80 h-full border-r bg-black flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-white text-blue-500 tracking-tight">
          Chats
        </h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        {contacts && contacts.length === 0 && (
          <div className="px-6 text-sm text-blue-800">
            No contacts yet. Invite someone to start chatting.
          </div>
        )}
        {contacts.map((c) => {
          const isActive = c._id === selectedContactId;
          const unread = Number(unreadCounts?.[c._id] || 0);
          const last = lastMessageByUserId?.[c._id];
          return (
            <button
              key={c._id}
              type="button"
              onClick={() => onSelectContact && onSelectContact(c)}
              className={`w-full text-left p-4 flex gap-3 cursor-pointer transition-colors ${
                isActive ? 'bg-yellow-200' : 'hover:bg-slate-50'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-200 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h4 className="font-bold text-green-600 truncate">
                    {c.name || c.email}
                  </h4>
                  <div className="flex items-center gap-2">
                    {unread > 0 && !isActive && (
                      <span className="min-w-[20px] h-5 px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold grid place-items-center">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                    <span className="text-[10px] text-green-400 font-medium">
                      {last?.time || ''}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-500 truncate">
                  {last?.preview || c.email}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};