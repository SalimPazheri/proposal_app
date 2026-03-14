import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronDown } from 'lucide-react';

interface AutocompleteFieldProps {
  table: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

interface ReferenceItem {
  id: string;
  name: string;
}

export default function AutocompleteField({ table, value, onChange, placeholder, required }: AutocompleteFieldProps) {
  const [items, setItems] = useState<ReferenceItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ReferenceItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadItems();
  }, [table]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadItems = async () => {
    const { data, error } = await supabase
      .from(table)
      .select('id, name')
      .order('name');

    if (!error && data) {
      setItems(data);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    if (newValue.length > 0) {
      const filtered = items.filter(item =>
        item.name.toLowerCase().includes(newValue.toLowerCase())
      );
      setFilteredItems(filtered);
      setShowDropdown(true);
    } else {
      setFilteredItems([]);
      setShowDropdown(false);
    }
  };

  const handleItemSelect = (selectedItem: ReferenceItem) => {
    setInputValue(selectedItem.name);
    onChange(selectedItem.name);
    setShowDropdown(false);
  };

  const handleBlur = async () => {
    setTimeout(async () => {
      if (inputValue && inputValue.trim()) {
        const existingItem = items.find(
          item => item.name.toLowerCase() === inputValue.toLowerCase()
        );

        if (!existingItem) {
          const { data, error } = await supabase
            .from(table)
            .insert([{ name: inputValue.trim() }])
            .select()
            .maybeSingle();

          if (!error && data) {
            setItems([...items, data]);
          }
        }
      }
    }, 200);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (inputValue.length > 0) {
              const filtered = items.filter(item =>
                item.name.toLowerCase().includes(inputValue.toLowerCase())
              );
              setFilteredItems(filtered);
              setShowDropdown(true);
            } else if (items.length > 0) {
              setFilteredItems(items);
              setShowDropdown(true);
            }
          }}
          onBlur={handleBlur}
          required={required}
          className="w-full px-4 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
          placeholder={placeholder}
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
      </div>

      {showDropdown && filteredItems.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleItemSelect(item);
              }}
              className="w-full text-left px-4 py-3 hover:bg-teal-50 transition-colors border-b border-slate-100 last:border-b-0"
            >
              <div className="font-medium text-slate-800">{item.name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
