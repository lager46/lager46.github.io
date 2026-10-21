/*
 * Supabase client configuration for MotoAuction.
 * The publishable/anon key is designed for browser use; RLS must remain enabled.
 * Never put a service_role or sb_secret key in this file.
 */
(function () {
  const SUPABASE_URL = 'https://ekduqagxarnukvlfntsx.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_QTRX7JGuv6Bu8dngkYjUYA_jaW_NX74';

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('Supabase JS library is not loaded. Add the @supabase/supabase-js v2 CDN script first.');
    return;
  }

  window.motoSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
})();
