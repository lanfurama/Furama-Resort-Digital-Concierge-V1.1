/**
 * Fuzzy search utilities for intelligent search functionality
 */

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,      // deletion
          dp[i][j - 1] + 1,      // insertion
          dp[i - 1][j - 1] + 1   // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate similarity score between two strings (0-1, higher is more similar)
 */
export function similarityScore(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLen;
}

/**
 * Check if query matches text with fuzzy matching
 */
export function fuzzyMatch(query: string, text: string, threshold: number = 0.6): boolean {
  if (!query || !text) return false;
  
  const lowerQuery = query.toLowerCase().trim();
  const lowerText = text.toLowerCase();
  
  // Exact match
  if (lowerText.includes(lowerQuery)) return true;
  
  // Word-by-word matching (more lenient)
  const queryWords = lowerQuery.split(/\s+/);
  const textWords = lowerText.split(/\s+/);
  
  // Check if all query words have a match
  const allWordsMatch = queryWords.every(qWord => 
    textWords.some(tWord => {
      if (tWord.includes(qWord) || qWord.includes(tWord)) return true;
      return similarityScore(qWord, tWord) >= threshold;
    })
  );
  
  if (allWordsMatch) return true;
  
  // Overall similarity check
  return similarityScore(lowerQuery, lowerText) >= threshold;
}

/**
 * Get search suggestions based on history and popular searches
 */
export function getSearchSuggestions(
  query: string,
  history: string[],
  popular: string[] = [],
  maxSuggestions: number = 5
): string[] {
  if (!query) {
    // Return recent history + popular
    return [...new Set([...history.slice(-3), ...popular])].slice(0, maxSuggestions);
  }
  
  const lowerQuery = query.toLowerCase();
  const suggestions = new Set<string>();
  
  // Add matching history items
  history.forEach(item => {
    if (item.toLowerCase().includes(lowerQuery) || fuzzyMatch(query, item, 0.5)) {
      suggestions.add(item);
    }
  });
  
  // Add matching popular items
  popular.forEach(item => {
    if (item.toLowerCase().includes(lowerQuery) || fuzzyMatch(query, item, 0.5)) {
      suggestions.add(item);
    }
  });
  
  return Array.from(suggestions).slice(0, maxSuggestions);
}

/**
 * Save search to history in localStorage
 */
export function saveSearchHistory(query: string, serviceType: string, maxHistory: number = 20): void {
  if (!query || !query.trim()) return;
  
  try {
    const key = `search_history_${serviceType}`;
    const history = getSearchHistory(serviceType);
    
    // Remove duplicates and add to front
    const filtered = history.filter(item => item.toLowerCase() !== query.toLowerCase());
    const updated = [query.trim(), ...filtered].slice(0, maxHistory);
    
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save search history:', error);
  }
}

/**
 * Get search history from localStorage
 */
export function getSearchHistory(serviceType: string): string[] {
  try {
    const key = `search_history_${serviceType}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to get search history:', error);
    return [];
  }
}

/**
 * Clear search history
 */
export function clearSearchHistory(serviceType: string): void {
  try {
    const key = `search_history_${serviceType}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear search history:', error);
  }
}
