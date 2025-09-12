// Simple event system for authentication events
type AuthEventListener = () => void;

class AuthEventEmitter {
  private tokenExpiredListeners: AuthEventListener[] = [];

  // Add listener for token expired event
  public addTokenExpiredListener(listener: AuthEventListener): void {
    this.tokenExpiredListeners.push(listener);
  }

  // Remove listener for token expired event
  public removeTokenExpiredListener(listener: AuthEventListener): void {
    this.tokenExpiredListeners = this.tokenExpiredListeners.filter(l => l !== listener);
  }

  // Emit token expired event
  public emitTokenExpired(): void {
    this.tokenExpiredListeners.forEach(listener => listener());
  }
}

// Create a singleton instance
export const authEvents = new AuthEventEmitter();