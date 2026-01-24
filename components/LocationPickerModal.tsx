import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { MapPin, Search, Building2, Waves, Utensils, X, TrendingUp } from 'lucide-react';
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

  // Popular locations (most frequently used) - optimized with Set for O(1) lookup
  const popularLocations = useMemo(() => {
    const popularSet = new Set([
      'main lobby', 'reception', 'beach', 'pool', 'restaurant', 
      'spa', 'fitness center', 'gym', 'bar', 'lobby'
    ]);
    
    // Filter to only include locations that exist in the list
    const matches: Location[] = [];
    for (const loc of locations) {
      const locNameLower = loc.name.toLowerCase();
      for (const pop of popularSet) {
        if (locNameLower.includes(pop)) {
          matches.push(loc);
          break;
        }
      }
      if (matches.length >= 6) break;
    }
    return matches;
  }, [locations]);

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

  const primaryColor = isBlueTheme ? 'blue' : 'emerald';
  const gradientFrom = isBlueTheme ? 'from-blue-50 to-indigo-50' : 'from-emerald-50 to-teal-50';
  const iconColor = isBlueTheme ? 'text-blue-600' : 'text-emerald-600';
  const borderColor = isBlueTheme ? 'border-blue-200' : 'border-emerald-200';
  const selectedBg = isBlueTheme
    ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
    : 'bg-gradient-to-br from-amber-400 to-orange-500';

  return (
    <>
      {/* Overlay (visual only; click-to-close via modal container) */}
      <div className="fixed inset-0 bg-black/50 z-[60]" aria-hidden="true" />
      {/* Modal - click backdrop to close */}
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center px-4 pt-12 pb-24"
        onClick={onClose}
      >
        <div
          ref={modalRef}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[calc(100vh-14rem)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className={`flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r ${gradientFrom} flex-shrink-0`}>
            <h3 className={`text-lg font-bold text-gray-800 flex items-center gap-2`}>
              <MapPin className={`w-5 h-5 ${iconColor}`} />
              {title}
            </h3>
            <button
              onClick={() => {
                setSearchQuery('');
                onClose();
              }}
              className="p-1.5 rounded-full"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex-1 flex flex-col p-4 space-y-3 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Search Bar */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${isBlueTheme ? 'text-blue-400' : 'text-emerald-400'} w-4 h-4`} />
              <input
                type="text"
                placeholder={`Search ${title.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => {
                  e.stopPropagation();
                  setSearchQuery(e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
                className={`w-full pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 bg-white border-2 ${borderColor} rounded-lg focus:outline-none focus:ring-2 ${isBlueTheme ? 'focus:ring-blue-400' : 'focus:ring-emerald-400'} focus:border-transparent ${isBlueTheme ? 'caret-blue-600' : 'caret-emerald-600'}`}
                style={{ caretColor: isBlueTheme ? '#2563eb' : '#10b981' }}
              />
            </div>

            {/* Popular Locations Suggestions */}
            {popularLocations.length > 0 && !debouncedSearchQuery && filterType === 'ALL' && (
              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                  <TrendingUp className={`w-4 h-4 ${iconColor}`} />
                  <span>{t('popular_locations')}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {popularLocations.map((loc) => {
                    const isExcluded = excludeLocation && loc.name === excludeLocation;
                    const isSelected = selectedLocation === loc.name;
                    return (
                      <button
                        key={loc.id || loc.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(loc);
                        }}
                        disabled={isExcluded}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1.5 ${
                          isSelected
                            ? `${selectedBg} text-white shadow-md`
                            : isExcluded
                            ? 'bg-red-50 text-red-600 opacity-60 cursor-not-allowed'
                            : `bg-gradient-to-r ${isBlueTheme ? 'from-blue-50 to-indigo-50' : 'from-emerald-50 to-teal-50'} ${isBlueTheme ? 'text-blue-700 border border-blue-200' : 'text-emerald-700 border border-emerald-200'}`
                        }`}
                      >
                        <MapPin className="w-3 h-3" />
                        {loc.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterType('VILLA');
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-full flex items-center gap-1.5 ${
                  filterType === 'VILLA'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-md shadow-blue-300/50'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Villas
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterType('FACILITY');
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-full flex items-center gap-1.5 ${
                  filterType === 'FACILITY'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md shadow-purple-300/50'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Waves className="w-3.5 h-3.5" />
                Facilities
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterType('RESTAURANT');
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-full flex items-center gap-1.5 ${
                  filterType === 'RESTAURANT'
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md shadow-orange-300/50'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                Restaurants
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterType('ALL');
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-full ${
                  filterType === 'ALL'
                    ? `bg-gradient-to-r ${isBlueTheme ? 'from-indigo-500 to-blue-600' : 'from-emerald-500 to-teal-600'} text-white shadow-md ${isBlueTheme ? 'shadow-indigo-300/50' : 'shadow-emerald-300/50'}`
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                All
              </button>
            </div>

            {/* Locations Grid */}
            <div className={`flex-1 min-h-0 overflow-y-auto rounded-xl border-2 ${borderColor} bg-gradient-to-br ${isBlueTheme ? 'from-blue-50/50 to-indigo-50/30' : 'from-emerald-50/50 to-teal-50/30'} p-4 scrollbar-thin ${isBlueTheme ? 'scrollbar-thumb-blue-300' : 'scrollbar-thumb-emerald-300'} scrollbar-track-gray-100`} onClick={(e) => e.stopPropagation()}>
              {filteredLocations.length > 0 ? (
                <div className="grid grid-cols-5 gap-2.5">
                  {filteredLocations.map((loc) => {
                    const isExcluded = excludeLocation && loc.name === excludeLocation;
                    const isSelected = selectedLocation === loc.name;
                    return (
                      <button
                        key={loc.id || loc.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(loc);
                        }}
                        title={isExcluded ? `Cannot select same as ${excludeLocation}` : loc.name}
                        disabled={isExcluded}
                        className={`relative min-h-[85px] h-auto p-2 rounded-xl border-2 flex flex-col items-center justify-center ${
                          isSelected
                            ? `${selectedBg} ${isBlueTheme ? 'border-blue-500 shadow-lg shadow-blue-300/50' : 'border-amber-500 shadow-lg shadow-amber-300/50'}`
                            : isExcluded
                            ? 'bg-red-50 border-red-200 opacity-60 cursor-not-allowed'
                            : 'bg-white border-gray-200 shadow-sm'
                        }`}
                      >
                        {/* Icon */}
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 flex-shrink-0 ${
                            isSelected
                              ? 'bg-white/30'
                              : isExcluded
                              ? 'bg-red-100'
                              : `bg-gradient-to-br ${isBlueTheme ? 'from-blue-100 to-indigo-100' : 'from-emerald-100 to-teal-100'}`
                          }`}
                        >
                          <MapPin
                            className={`w-4 h-4 ${
                              isSelected ? 'text-white' : isExcluded ? 'text-red-600' : isBlueTheme ? 'text-blue-700' : 'text-emerald-700'
                            }`}
                          />
                        </div>

                        {/* Name */}
                        <div
                          className={`text-[11px] font-semibold text-center leading-tight px-0.5 break-words ${
                            isSelected ? 'text-white' : isExcluded ? 'text-red-600' : 'text-gray-800'
                          }`}
                        >
                          {loc.name}
                        </div>

                        {/* Selected indicator */}
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-md">
                            <div className={`w-1.5 h-1.5 ${isBlueTheme ? 'bg-blue-500' : 'bg-amber-500'} rounded-full`}></div>
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
