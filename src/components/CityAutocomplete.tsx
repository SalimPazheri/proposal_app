import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, ChevronDown } from 'lucide-react';

interface City {
  id: string;
  city: string;
  country: string;
}

interface CityAutocompleteProps {
  value: string;
  country: string;
  onChange: (city: string, country: string) => void;
}

export default function CityAutocomplete({ value, country, onChange }: CityAutocompleteProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCities();
  }, []);

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

  const loadCities = async () => {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .order('city');

    if (!error && data) {
      setCities(data);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue, country);

    if (newValue.length > 0) {
      const filtered = cities.filter(city =>
        city.city.toLowerCase().includes(newValue.toLowerCase())
      );
      setFilteredCities(filtered);
      setShowDropdown(true);
    } else {
      setFilteredCities([]);
      setShowDropdown(false);
    }
  };

  const handleCitySelect = async (selectedCity: City) => {
    setInputValue(selectedCity.city);
    onChange(selectedCity.city, selectedCity.country);
    setShowDropdown(false);
  };

  const handleBlur = async () => {
    setTimeout(async () => {
      if (inputValue && country) {
        const existingCity = cities.find(
          c => c.city.toLowerCase() === inputValue.toLowerCase()
        );

        if (!existingCity) {
          const { data, error } = await supabase
            .from('cities')
            .insert([{ city: inputValue, country: country }])
            .select()
            .maybeSingle();

          if (!error && data) {
            setCities([...cities, data]);
          }
        }
      }
    }, 200);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (inputValue.length > 0) {
              const filtered = cities.filter(city =>
                city.city.toLowerCase().includes(inputValue.toLowerCase())
              );
              setFilteredCities(filtered);
              setShowDropdown(true);
            }
          }}
          onBlur={handleBlur}
          className="w-full pl-11 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
          placeholder="Start typing city name..."
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
      </div>

      {showDropdown && filteredCities.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredCities.map((city) => (
            <button
              key={city.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleCitySelect(city);
              }}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-b-0"
            >
              <div className="font-medium text-slate-800">{city.city}</div>
              <div className="text-sm text-slate-500">{city.country}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
