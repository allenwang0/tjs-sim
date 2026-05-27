// ============================================================
// SUPABASE CLIENT — Leaderboard Integration
// ============================================================

// Lightweight Supabase client (no external dependencies)
class SupabaseClient {
  constructor(url, anonKey) {
    this.url = url;
    this.anonKey = anonKey;
    this.headers = {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    };
  }

  async submitScore(entry) {
    try {
      const response = await fetch(`${this.url}/rest/v1/leaderboard`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(entry)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Supabase error: ${error}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to submit score:', error);
      return { success: false, error: error.message };
    }
  }

  async getLeaderboard(mode, limit = 100) {
    try {
      const response = await fetch(
        `${this.url}/rest/v1/leaderboard?mode=eq.${mode}&order=score.desc&limit=${limit}`,
        {
          method: 'GET',
          headers: this.headers
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      return [];
    }
  }

  async getTopScores(limit = 10) {
    try {
      const response = await fetch(
        `${this.url}/rest/v1/leaderboard?order=score.desc&limit=${limit}`,
        {
          method: 'GET',
          headers: this.headers
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch top scores');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch top scores:', error);
      return [];
    }
  }

  async getRecentScores(limit = 20) {
    try {
      const response = await fetch(
        `${this.url}/rest/v1/leaderboard?order=created_at.desc&limit=${limit}`,
        {
          method: 'GET',
          headers: this.headers
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch recent scores');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch recent scores:', error);
      return [];
    }
  }
}

// Initialize global Supabase client
let supabaseClient = null;

function initSupabase() {
  if (!window.CONFIG) {
    console.warn('CONFIG not loaded. Leaderboard features disabled.');
    return false;
  }
  if (!window.CONFIG.SUPABASE) {
    console.warn('SUPABASE config missing. Leaderboard features disabled.');
    return false;
  }
  if (!window.CONFIG.SUPABASE.url || !window.CONFIG.SUPABASE.anonKey) {
    console.warn('SUPABASE config incomplete. Leaderboard features disabled.');
    return false;
  }

  try {
    supabaseClient = new SupabaseClient(
      window.CONFIG.SUPABASE.url,
      window.CONFIG.SUPABASE.anonKey
    );
    console.log('Supabase initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return false;
  }
}

window.Supabase = {
  init: initSupabase,
  get client() { return supabaseClient; }
};
