const SUPABASE_URL = 'https://bvrkoviyrijcdnulnwxz.supabase.co';

const SUPABASE_ANON_KEY = 'YOUR_PUBLISHABLE_KEY';

window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

console.log('Supabase initialized:', window.supabaseClient);
console.log('Supabase Auth:', window.supabaseClient.auth);