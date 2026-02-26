import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { MapPin, Search, Building2, Waves, Utensils, X } from 'lucide-react';
import { Location } from '../types';
import { useTranslation } from '../contexts/LanguageContext';

type FilterType = 'ALL' | 'VILLA' | 'FACILITY' | 'RESTAURANT';

interface LocationPickerModalProps {
  isOpen: boolean;
  title: string;
  locations: Location[];
  selectedLocation: string;
  excludeLocation?: string; // Location to exclude (e.g., pickup when selecting destination)
  onSelect: (location: string) => void;
  onClose: () => void;
  onValidationError?: (message: string) => void;
  themeColor?: 'blue' | 'emerald';
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  title,
  locations,
  selectedLocation,
  excludeLocation,
  onSelect,
  onClose,
  onValidationError,
  themeColor = 'blue'
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const modalRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isBlueTheme = themeColor === 'blue';

  // Debounce search input for better performance
  React.useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 200); // 200ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);


  // Memoize search query lowercase to avoid repeated conversions
  const searchQueryLower = useMemo(() => debouncedSearchQuery.toLowerCase(), [debouncedSearchQuery]);

  const filteredLocations = useMemo(() => {
    if (!searchQuery && filterType === 'ALL') {
      // Fast path: return all locations pre-sorted if no filters
      return locations.slice().sort((a, b) => a.name.localeCompare(b.name));
    }

    const results: Location[] = [];
    const queryLower = searchQueryLower;

    for (const loc of locations) {
      // Early exit for filter check (cheaper than string search)
      if (filterType !== 'ALL' && loc.type !== filterType) continue;
      
      // Only do string search if query exists
      if (queryLower && !loc.name.toLowerCase().includes(queryLower)) continue;
      
      results.push(loc);
    }

    // Only sort if we have results
    return results.length > 0 
      ? results.sort((a, b) => a.name.localeCompare(b.name))
      : results;
  }, [locations, searchQueryLower, filterType]);

  const handleSelect = useCallback((loc: Location) => {
    if (excludeLocation && loc.name === excludeLocation) {
      onValidationError?.(t('pickup_destination_same_error'));
      return;
    }
    onSelect(loc.name);
    setSearchQuery('');
    onClose();
  }, [excludeLocation, onSelect, onClose, onValidationError, t]);

  if (!isOpen) return null;

  const iconColor = isBlueTheme ? 'text-blue-600' : 'text-emerald-600';
  const pillSelected = isBlueTheme ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white';
  const pillUnselected = 'bg-gray-100 text-gray-700';
  const selectedBg = isBlueTheme ? 'bg-blue-600 border-blue-600' : 'bg-emerald-600 border-emerald-600';
  const listBg = 'bg-gray-50';
  const borderColor = 'border-gray-200';

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[60]" aria-hidden="true" />
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center px-4 pt-12 pb-24"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        onClick={onClose}
      >
        <div
          ref={modalRef}
          className="bg-white rounded-xl shadow w-full max-w-md max-h-[calc(100vh-8rem)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <MapPin className={`w-5 h-5 ${iconColor}`} />
              {title}
            </h3>
            <button
              onClick={() => {
                setSearchQuery('');
                onClose();
              }}
              className="p-2 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation hover:bg-gray-200"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="flex-1 flex flex-col p-4 space-y-3 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4`} />
              <input
                type="text"
                placeholder={`Search ${title.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => {
                  e.stopPropagation();
                  setSearchQuery(e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                className={`w-full pl-10 pr-3 py-2.5 min-h-[44px] text-sm text-gray-900 placeholder:text-gray-400 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500`}
              />
            </div>

            <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => { e.stopPropagation(); setFilterType('VILLA'); }}
                className={`px-3 py-2 min-h-[36px] text-xs font-bold rounded-full flex items-center gap-1.5 touch-manipulation ${filterType === 'VILLA' ? pillSelected : pillUnselected}`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Villas
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setFilterType('FACILITY'); }}
                className={`px-3 py-2 min-h-[36px] text-xs font-bold rounded-full flex items-center gap-1.5 touch-manipulation ${filterType === 'FACILITY' ? pillSelected : pillUnselected}`}
              >
                <Waves className="w-3.5 h-3.5" />
                Facilities
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setFilterType('RESTAURANT'); }}
                className={`px-3 py-2 min-h-[36px] text-xs font-bold rounded-full flex items-center gap-1.5 touch-manipulation ${filterType === 'RESTAURANT' ? pillSelected : pillUnselected}`}
              >
                <Utensils className="w-3.5 h-3.5" />
                Restaurants
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setFilterType('ALL'); }}
                className={`px-3 py-2 min-h-[36px] text-xs font-bold rounded-full touch-manipulation ${filterType === 'ALL' ? pillSelected : pillUnselected}`}
              >
                All
              </button>
            </div>

            <div className={`flex-1 min-h-0 overflow-y-auto rounded-xl border ${borderColor} ${listBg} p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100`} onClick={(e) => e.stopPropagation()}>
              {filteredLocations.length > 0 ? (
                <div className="grid grid-cols-4 gap-2.5">
                  {filteredLocations.map((loc) => {
                    const isExcluded = excludeLocation && loc.name === excludeLocation;
                    const isSelected = selectedLocation === loc.name;
                    return (
                      <button
                        key={loc.id || loc.name}
                        onClick={(e) => { e.stopPropagation(); handleSelect(loc); }}
                        title={isExcluded ? `Cannot select same as ${excludeLocation}` : loc.name}
                        disabled={isExcluded}
                        className={`relative min-h-[85px] h-auto p-2 rounded-xl border flex flex-col items-center justify-center touch-manipulation ${
                          isSelected
                            ? `${selectedBg} text-white border`
                            : isExcluded
                            ? 'bg-red-50 border-red-200 opacity-60 cursor-not-allowed'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 flex-shrink-0 ${isSelected ? 'bg-white/20' : isExcluded ? 'bg-red-100' : 'bg-gray-100'}`}>
                          <MapPin className={`w-4 h-4 ${isSelected ? 'text-white' : isExcluded ? 'text-red-600' : 'text-gray-600'}`} />
                        </div>
                        <div className={`text-[11px] font-semibold text-center leading-tight px-0.5 break-words ${isSelected ? 'text-white' : isExcluded ? 'text-red-600' : 'text-gray-800'}`}>
                          {loc.name}
                        </div>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                            <div className={`w-1.5 h-1.5 ${isBlueTheme ? 'bg-blue-600' : 'bg-emerald-600'} rounded-full`} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-gray-500">{t('no_locations_found')}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
