import { Check, CheckCheck } from 'lucide-react';

export const MessageBubble = ({ text, time, isOwn, status }) => (
  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 animate-in fade-in slide-in-from-bottom-2`}>
    <div className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm relative 
      ${isOwn ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
      
      <p className="text-sm md:text-base leading-relaxed">{text}</p>
      
      <div className="flex items-center justify-end mt-1 gap-1">
        <span className={`text-[10px] ${isOwn ? 'text-indigo-200' : 'text-slate-400'}`}>{time}</span>
        {isOwn && (
          <span className={status === 'read' ? 'text-sky-300' : 'text-indigo-300'}>
            {status === 'read' ? <CheckCheck size={14} /> : <Check size={14} />}
          </span>
        )}
      </div>
    </div>
  </div>
);