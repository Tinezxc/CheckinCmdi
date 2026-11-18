// =====================================================================
// HAVEN: Edge Function "admin-users"
// Creates staff/manager accounts and runs admin actions that the browser
// is NOT allowed to do itself (it needs the secret service-role key).
//
// Deploy: Supabase dashboard -> Edge Functions -> Create a new function
//         -> name it  admin-users  -> paste this whole file -> Deploy.
//         (Leave "Verify JWT" ON.)  The secret key is added automatically.
//
// Actions (POST JSON body):
//   { action: "create", email, full_name, role, expires_at?, temp_password?, redirect_to? }   Super admin
//   { action: "set_status", user_id, status: "active" | "suspended" }                         Super admin (suspend) / any admin (reactivate)
//   { action: "reset_password", user_id, redirect_to? }                                       any admin
//   { action: "reset_2fa", user_id }                                                          any admin
//   { action: "delete", user_id }                                                             Super admin
// =====================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const VALID_ROLES = ['client', 'front-desk', 'housekeeping', 'maintenance', 'manager', 'support-admin', 'super-admin'];
const ADMIN_ROLES = ['support-admin', 'super-admin'];

function reply(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

class HttpError extends Error {
    status: number;
    constructor(message: string, status = 400) { super(message); this.status = status; }
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

    try {
        const url = Deno.env.get('SUPABASE_URL')!;
        const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

        /* ---------- who is calling? ---------- */
        const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
        const { data: auth, error: authErr } = await admin.auth.getUser(token);
        if (authErr || !auth?.user) throw new HttpError('Please sign in again.', 401);
        const caller = auth.user;

        const { data: me } = await admin.from('profiles')
            .select('role, full_name, status, access_expires_at').eq('id', caller.id).single();
        const expired = me?.access_expires_at && new Date(me.access_expires_at) < new Date();
        if (!me || !ADMIN_ROLES.includes(me.role) || me.status === 'suspended' || expired) {
            throw new HttpError('Admin access is required.', 403);
        }
        const isSuper = me.role === 'super-admin';

        const body = await req.json();
        const action = String(body.action || '');

        /* ---------- small helpers ---------- */
        const audit = (act: string, targetId: string | null, reason: string | null, details: unknown = null) =>
            admin.from('audit_log').insert({
                actor_id: caller.id, actor_name: me.full_name, actor_role: me.role,
                action: act, target_type: 'user', target_id: targetId, reason, details
            });

        async function loadTarget(id: unknown) {
            if (!id) throw new HttpError('Missing user.');
            const { data, error } = await admin.from('profiles').select('id, role, full_name, status').eq('id', String(id)).single();
            if (error || !data) throw new HttpError('User not found.', 404);
            // support admins only touch non-admin accounts
            if (!isSuper && ADMIN_ROLES.includes(data.role)) throw new HttpError('Only a Super admin can manage admin accounts.', 403);
            return data;
        }

        async function otherActiveSuperAdmins(excludeId: string) {
            const { count } = await admin.from('profiles').select('id', { count: 'exact', head: true })
                .eq('role', 'super-admin').neq('id', excludeId).neq('status', 'suspended');
            return count || 0;
        }

        /* ================= CREATE ================= */
        if (action === 'create') {
            if (!isSuper) throw new HttpError('Only a Super admin can create accounts.', 403);

            const email = String(body.email || '').trim().toLowerCase();
            const fullName = String(body.full_name || '').trim();
            const role = String(body.role || '');
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError('Enter a valid email address.');
            if (fullName.length < 2) throw new HttpError('Enter the full name.');
            if (!VALID_ROLES.includes(role)) throw new HttpError('Unknown role.');
            const tempPassword = body.temp_password ? String(body.temp_password) : '';
            if (tempPassword && tempPassword.length < 8) throw new HttpError('The temporary password must be at least 8 characters.');

            // same fields the public sign-up sends, so your profile trigger accepts it
            const stamp = Date.now().toString().slice(-6);
            const meta = {
                role: 'client',                       // the database sets the real role below
                full_name: fullName,
                guest_id: 'STF-' + stamp,
                reg_id: 'STF-' + stamp,
                phone: '', institution: 'Haven', branch: 'Main'
            };

            // allow this email through the invite-only sign-up check (see google-forms-registration.sql)
            await admin.from('signup_allowlist').upsert({ email, note: 'created by ' + (me.full_name || 'admin') });

            let userId: string;
            if (tempPassword) {
                const { data, error } = await admin.auth.admin.createUser({
                    email, password: tempPassword, email_confirm: true, user_metadata: meta
                });
                if (error) throw new HttpError(error.message);
                userId = data.user.id;
            } else {
                const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
                    data: meta, redirectTo: body.redirect_to || undefined
                });
                if (error) throw new HttpError(error.message);
                userId = data.user.id;
            }

            // make sure the profile row exists (your sign-up trigger normally creates it)
            const { data: prof } = await admin.from('profiles').select('id').eq('id', userId).maybeSingle();
            if (!prof) {
                const { error: insErr } = await admin.from('profiles').insert({ id: userId, full_name: fullName });
                if (insErr) throw new HttpError('The account was created but its profile could not be: ' + insErr.message, 500);
            }

            // role goes through the guarded function (it also writes the role history)
            const { error: roleErr } = await admin.rpc('admin_apply_role', {
                p_actor: caller.id, p_target: userId, p_role: role,
                p_reason: 'Account created by ' + (me.full_name || 'a Super admin')
            });
            if (roleErr) throw new HttpError(roleErr.message, 500);

            await admin.from('profiles').update({
                full_name: fullName,
                status: 'invited',
                access_expires_at: body.expires_at ? new Date(body.expires_at + 'T23:59:59Z').toISOString() : null
            }).eq('id', userId);

            await audit('user.create', userId, null, { email, role, method: tempPassword ? 'temporary password' : 'email invite' });
            return reply({ ok: true, user_id: userId, invited: !tempPassword });
        }

        /* ================= SET STATUS (suspend / reactivate) ================= */
        if (action === 'set_status') {
            const target = await loadTarget(body.user_id);
            const status = String(body.status || '');
            if (!['active', 'suspended'].includes(status)) throw new HttpError('Unknown status.');
            if (status === 'suspended') {
                if (!isSuper) throw new HttpError('Only a Super admin can suspend accounts.', 403);
                if (target.id === caller.id) throw new HttpError('You cannot suspend yourself.');
                if (target.role === 'super-admin' && (await otherActiveSuperAdmins(target.id)) === 0) {
                    throw new HttpError('There must always be at least one active Super admin.');
                }
            }
            const { error } = await admin.auth.admin.updateUserById(target.id, {
                ban_duration: status === 'suspended' ? '876000h' : 'none'
            });
            if (error) throw new HttpError(error.message);
            await admin.from('profiles').update({ status }).eq('id', target.id);
            await audit(status === 'suspended' ? 'user.suspend' : 'user.reactivate', target.id, null);
            return reply({ ok: true });
        }

        /* ================= RESET PASSWORD (sends the email) ================= */
        if (action === 'reset_password') {
            const target = await loadTarget(body.user_id);
            const { data: u, error: uErr } = await admin.auth.admin.getUserById(target.id);
            if (uErr || !u?.user?.email) throw new HttpError('That account has no email address.');
            const anon = createClient(url, anonKey, { auth: { persistSession: false } });
            const { error } = await anon.auth.resetPasswordForEmail(u.user.email, { redirectTo: body.redirect_to || undefined });
            if (error) throw new HttpError(error.message);
            await audit('user.reset_password', target.id, null);
            return reply({ ok: true });
        }

        /* ================= RESET 2FA ================= */
        if (action === 'reset_2fa') {
            const target = await loadTarget(body.user_id);
            const { data: list, error: listErr } = await admin.auth.admin.mfa.listFactors({ userId: target.id });
            if (listErr) throw new HttpError(listErr.message);
            for (const f of list?.factors ?? []) {
                await admin.auth.admin.mfa.deleteFactor({ id: f.id, userId: target.id });
            }
            await audit('user.reset_2fa', target.id, null);
            return reply({ ok: true });
        }

        /* ================= DELETE ================= */
        if (action === 'delete') {
            if (!isSuper) throw new HttpError('Only a Super admin can delete accounts.', 403);
            const target = await loadTarget(body.user_id);
            if (target.id === caller.id) throw new HttpError('You cannot delete yourself.');
            if (target.role === 'super-admin' && (await otherActiveSuperAdmins(target.id)) === 0) {
                throw new HttpError('There must always be at least one active Super admin.');
            }
            await audit('user.delete', target.id, null, { name: target.full_name, role: target.role });
            await admin.from('profiles').delete().eq('id', target.id);
            const { error } = await admin.auth.admin.deleteUser(target.id);
            if (error) throw new HttpError(error.message);
            return reply({ ok: true });
        }

        throw new HttpError('Unknown action.');
    } catch (err) {
        const status = err instanceof HttpError ? err.status : 500;
        const message = err instanceof Error ? err.message : 'Something went wrong.';
        return reply({ error: message }, status);
    }
});
