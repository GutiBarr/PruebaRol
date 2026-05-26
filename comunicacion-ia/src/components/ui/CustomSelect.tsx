import { useState, useEffect, useRef } from 'react';

export function CustomSelect({ value, onChange, options, placeholder, required }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const index = options.findIndex((o: any) => o.value === value);
      setHighlightedIndex(index >= 0 ? index : 0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!listRef.current) return;

    const list = listRef.current;
    const itemHeight = 40;
    const itemTop = highlightedIndex * itemHeight;
    const itemBottom = itemTop + itemHeight;
    const visibleTop = list.scrollTop;
    const visibleBottom = visibleTop + list.clientHeight;

    if (itemBottom > visibleBottom) {
      list.scrollTop = itemBottom - list.clientHeight;
    }
    if (itemTop < visibleTop) {
      list.scrollTop = itemTop;
    }
  }, [highlightedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        onChange(options[highlightedIndex].value);
      }
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative min-w-[200px]" ref={dropdownRef}>
      <button
        type="button"
        className={`w-full border border-slate-200 rounded-xl p-2.5 text-left focus:ring-2 focus:ring-[#4040FF] outline-none transition-all bg-white flex justify-between items-center text-sm shadow-sm hover:border-slate-300 ${!value ? 'text-slate-500 font-medium' : 'text-slate-700 font-medium'}`}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
      >
        <span className="truncate">{value ? options.find((o: any) => o.value === value)?.label : placeholder}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>

      {required && (
        <input 
          type="text" 
          className="opacity-0 absolute inset-0 w-full h-full pointer-events-none" 
          required 
          value={value} 
          onChange={() => { }} 
          onFocus={() => dropdownRef.current?.querySelector('button')?.focus()} 
        />
      )}

      {isOpen && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.08)] max-h-60 overflow-auto py-2 text-sm"
        >
          {options.map((option: any, index: number) => (
            <li
              key={option.value}
              className={`px-4 py-2.5 cursor-pointer transition-colors ${highlightedIndex === index ? 'bg-[#4040FF]/10 text-[#4040FF] font-semibold' :
                value === option.value ? 'bg-[#4040FF]/5 font-semibold text-[#4040FF]' : 'text-slate-700 hover:bg-slate-50'
                }`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
