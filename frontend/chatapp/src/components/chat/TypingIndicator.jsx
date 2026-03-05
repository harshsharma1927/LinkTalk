export const TypingIndicator = ({ name }) => (
  <div className="flex flex-col gap-1 ml-4 mb-4">
    <span className="text-[10px] text-slate-400 font-medium ml-2">{name} is typing</span>
    <div className="flex items-center gap-1 bg-white border border-slate-100 w-fit px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
      <div className="dot-flashing [animation-delay:-0.3s]"></div>
      <div className="dot-flashing [animation-delay:-0.15s]"></div>
      <div className="dot-flashing"></div>
    </div>
  </div>
);