function getRandomString() {
  return Math.random().toString(16).slice(2);
}

const SESSION_ID_KEY = 'hin:session_id';
const SESSION_LAST_UPDATED_KEY = 'hin:session_last_updated';
const SESSION_DURATION = 1800000; // 30 minutes in milliseconds

// Simple session id mechanism
class Session {
  constructor() {
    const id = localStorage.getItem(SESSION_ID_KEY);
    const lastUpdated = localStorage.getItem(SESSION_LAST_UPDATED_KEY);

    // If id and time exist check if the session has expired
    if (id && lastUpdated) {
      const time = parseInt(lastUpdated, 10);
      const now = new Date().getTime();

      if (now - time > SESSION_DURATION) {
        // Session expired, start a new one
        this.startNewSession();
      }
    } else {
      // If there is no existing session start a new one
      this.startNewSession();
    }

    // Always update time
    this.setLastUpdated();
  }

  /* eslint-disable class-methods-use-this */
  getId() {
    return localStorage.getItem(SESSION_ID_KEY);
  }

  startNewSession() {
    const id = `${getRandomString()}${getRandomString()}`;

    localStorage.setItem(SESSION_ID_KEY, id);
  }

  setLastUpdated() {
    const now = new Date().getTime();

    localStorage.setItem(SESSION_LAST_UPDATED_KEY, now);
  }
}

window.session = new Session();
