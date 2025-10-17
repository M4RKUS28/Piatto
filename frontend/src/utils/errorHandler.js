/**
 * Extract user-friendly error message from API error response
 * Handles FastAPI validation errors and other error formats
 */
export const extractErrorMessage = (error) => {
  if (!error) {
    return 'An unknown error occurred';
  }

  const detail = error.response?.data?.detail;
  
  // Handle FastAPI validation errors (array format)
  if (Array.isArray(detail)) {
    const messages = detail
      .map((err) => {
        if (typeof err === 'string') {
          return err;
        }
        
        if (typeof err === 'object') {
          // Extract field name from location path
          // loc is typically ['body', 'fieldname'] or ['query', 'fieldname']
          const loc = err.loc || [];
          const field = loc[loc.length - 1];
          const message = err.msg || err.message || 'Invalid value';
          
          // Remove "Value error, " prefix if present
          const cleanMessage = message.replace(/^Value error,\s*/i, '');
          
          // Format: "Field: Error message" (but skip generic location like 'body')
          if (field && field !== 'body' && field !== 'query') {
            return `${capitalizeFirst(field)}: ${cleanMessage}`;
          }
          
          return cleanMessage;
        }
        
        return null;
      })
      .filter(Boolean);
    
    return messages.length > 0 ? messages.join(' | ') : 'Validation failed';
  }
  
  // Handle string detail
  if (typeof detail === 'string') {
    return detail;
  }
  
  // Handle object detail with message
  if (typeof detail === 'object' && detail.message) {
    return detail.message;
  }
  
  // Fallback to message field
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Generic error
  if (error.message) {
    return error.message;
  }
  
  return 'An error occurred';
};

/**
 * Capitalize first letter of a string
 */
const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};
