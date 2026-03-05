import React from 'react';

export const Input = ({ label, icon: Icon, ...props }) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-semibold text-slate-700 ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
            <Icon size={18} />
          </div>
        )}
        <input
          {...props}
          className={`
            w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 
            ${Icon ? 'pl-11' : 'px-4'} pr-4
            text-slate-700 placeholder:text-slate-400
            outline-none ring-offset-2 ring-indigo-500/20
            focus:ring-4 focus:border-indigo-500 focus:bg-white
            transition-all duration-200
          `}
        />
      </div>
    </div>
  );
};