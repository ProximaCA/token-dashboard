/**
 * Formats a number with commas for thousands separators
 * @param num The number to format
 * @returns Formatted number string with commas
 */
export const formatNumber = (num: number): string => {
  if (num === 0 || isNaN(num)) return '0';
  
  // For very large numbers, use scientific notation
  if (num > 1e15) {
    return num.toExponential(2);
  }
  
  // Handle numbers with many decimal places
  if (num < 0.000001 && num > 0) {
    return num.toExponential(6);
  }
  
  // Format with commas and appropriate decimal places
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: num < 0.01 ? 6 : num < 1 ? 4 : 2,
  }).format(num);
};

/**
 * Formats an address by truncating the middle part
 * @param address The Ethereum address to format
 * @param startLength Number of characters to show at the start
 * @param endLength Number of characters to show at the end
 * @returns Formatted address string
 */
export const formatAddress = (
  address: string,
  startLength = 6,
  endLength = 4
): string => {
  if (!address) return '';
  const start = address.substring(0, startLength);
  const end = address.substring(address.length - endLength);
  return `${start}...${end}`;
};

/**
 * Formats a number to always show exactly three decimal places
 * @param num The number to format
 * @returns Formatted number string with exactly three decimal places
 */
export const formatToThreeDecimals = (num: number): string => {
  if (num === 0 || isNaN(num)) return '0.000';
  
  // For very small or very large numbers, use scientific notation
  if (num < 0.001 || num > 1e9) {
    return num.toExponential(3);
  }
  
  // Format with exactly three decimal places
  return num.toFixed(3);
};

/**
 * Formats a timestamp to a human-readable date and time
 * @param timestamp Unix timestamp (seconds)
 * @returns Formatted date string
 */
export const formatTimestamp = (timestamp: number): string => {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format price change to show positive/negative sign and percentage
 * @param change The percentage change value
 * @returns Formatted change string with sign and percentage
 */
export const formatPriceChange = (change: number): string => {
  if (isNaN(change)) return '0.00%';
  
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}; 