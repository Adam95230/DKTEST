/**
 * Get the API base URL, automatically detecting if we're on mobile or desktop
 * Uses window.location.hostname to detect the current host
 */
export function getApiBaseUrl(port: number): string {
  if (typeof window === 'undefined') {
    return `http://localhost:${port}`;
  }

  const hostname = window.location.hostname;
  
  // If accessing from localhost, use localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://localhost:${port}`;
  }
  
  // Otherwise, use the current hostname (for mobile access)
  return `http://${hostname}:${port}`;
}

