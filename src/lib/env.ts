
// Environment configuration to handle different deployment contexts
export const getBaseUrl = () => {
  // For sandbox environments
  if (window.location.hostname.includes('sandbox') || 
      window.location.hostname.includes('codesandbox') || 
      window.location.hostname.includes('stackblitz')) {
    return window.location.origin;
  }
  
  // For GitHub Pages deployments
  if (window.location.hostname.includes('github.io')) {
    const repoName = window.location.pathname.split('/')[1];
    return `${window.location.origin}/${repoName}`;
  }
  
  // For local development or other environments
  return window.location.origin;
};

// Check if we're in a sandbox environment
export const isSandboxEnvironment = () => {
  return window.location.hostname.includes('sandbox') || 
         window.location.hostname.includes('codesandbox') || 
         window.location.hostname.includes('stackblitz');
};

// For better error logging
export const logError = (error: unknown, context?: string) => {
  console.error(`[NUST App Error]${context ? ` ${context}: ` : ': '}`, error);
};
