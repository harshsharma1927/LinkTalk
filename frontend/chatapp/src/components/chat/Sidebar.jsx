export const Sidebar = ({
  contacts,
  selectedContactId,
  onSelectContact,
  unreadCounts = {},
  lastMessageByUserId = {},
  searchQuery = '',
  onSearchChange,
  searchResults = [],
  onSelectSearchResult,
  onClose,
}) => {
  return (
    <div className="w-full md:w-80 h-full border-r bg-black flex flex-col">
      <div className="p-4 flex items-center justify-between">
        <h1 className="text-2xl text-blue-500 tracking-tight font-semibold">
          Chats
        </h1>
        {onClose && (
          <button
            type="button"
            className="md:hidden text-slate-200 text-sm px-2 py-1 rounded-full hover:bg-slate-800"
            onClick={onClose}
          >
            Close
          </button>
        )}
      </div>
      <div className="px-4 pb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          placeholder="Search by name or email"
          className="w-full px-3 py-2 rounded-full bg-slate-900 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      {searchQuery && (
        <div className="px-4 pb-1 text-xs text-slate-400">Search results</div>
      )}
      {searchQuery && (
        <div className="max-h-60 overflow-y-auto">
          {searchResults.length === 0 ? (
            <div className="px-6 pb-2 text-xs text-blue-800">
              No users found.
            </div>
          ) : (
            searchResults.map((u) => (
              <button
                key={u._id}
                type="button"
                onClick={() =>
                  onSelectSearchResult && onSelectSearchResult(u)
                }
                className="w-full text-left px-4 py-2 flex gap-3 items-center hover:bg-slate-900"
              >
                <div className="w-8 h-8 rounded-full bg-slate-700 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-100 truncate">
                    {u.name || u.email}
                  </div>
                  <div className="text-xs text-slate-400 truncate">
                    {u.email}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
      <div className="flex-1 overflow-y-auto mt-2">
        {contacts && contacts.length === 0 && !searchQuery && (
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