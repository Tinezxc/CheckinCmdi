const SUPABASE_URL = 'https://bvrkoviyrijcdnulnwxz.supabase.co';

const SUPABASE_ANON_KEY = 'sb_publishable_ydW1NNcifKSKt0BuOwH2vQ_vsny-01p';

window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

console.log('Supabase initialized:', window.supabaseClient);
console.log('Supabase Auth:', window.supabaseClient.auth);