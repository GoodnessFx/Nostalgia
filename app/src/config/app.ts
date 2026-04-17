export const APP_CONFIG = {
  apiBaseUrl: typeof window !== 'undefined' && window.location && window.location.hostname !== 'localhost' ? '/api' : 'http://localhost:4000/api',
  internalApiKey: "",
  supabaseUrl: "",
  supabaseAnonKey: "",
};

export const BRAND = {
  appName: "Nostalgia",
  tagline: "DROP YOUR REALITY",
};
