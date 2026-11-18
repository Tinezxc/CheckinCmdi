import { createClient } from 'npm:@supabase/supabase-js@2';

/* ---------- settings ---------- */
const TOKEN_TTL_HOURS = 48;
const OTP_COOLDOWN_SECONDS = 60;
const MAX_OTP_SENDS = 5;
const MAX_VERIFY_ATTEMPTS = 5;
const RELINK_MIN_MINUTES = 5;

const LOGIN_OTP_TTL_MINUTES = 10;
const LOGIN_OTP_COOLDOWN_SECONDS = 60;
const LOGIN_OTP_MAX_SENDS = 4;       // initial send + up to three resends
const LOGIN_OTP_MAX_ATTEMPTS = 5;

const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-intake-secret, x-supabase-api-version, x-region',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/* ---------- shared helpers ---------- */
function reply(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
    });
}

function fail(code: string, extra: Record<string, unknown> = {}): Response {
    return reply({ ok: false, code, ...extra });
}

class HttpError extends Error {
    status: number;
    constructor(message: string, status = 400) {
        super(message);
        this.status = status;
    }
}

async function sha256Hex(value: string): Promise<string> {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
}

function newToken(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    return btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function newReference(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    return 'CMDI-' + Array.from(bytes)
        .map((byte) => alphabet[byte % alphabet.length])
        .join('');
}

function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}

function maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return '***';
    const visible = local.length <= 3 ? local.slice(0, 1) : local.slice(0, 3);
    return `${visible}***@${domain}`;
}

function text(value: unknown, max: number): string {
    return String(value ?? '').trim().slice(0, max);
}

function getDefaultKey(legacyName: string, collectionName: string): string {
    const legacy = Deno.env.get(legacyName);
    if (legacy) return legacy;

    const raw = Deno.env.get(collectionName);
    if (!raw) return '';

    try {
        const parsed = JSON.parse(raw);
        return typeof parsed?.default === 'string' ? parsed.default : '';
    } catch {
        return '';
    }
}

function decodeJwtPayload(jwt: string): Record<string, unknown> {
    const parts = jwt.split('.');
    if (parts.length !== 3) throw new HttpError('Invalid session token.', 500);

    const encoded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = encoded + '='.repeat((4 - encoded.length % 4) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ---------- registration link helper (outside request handler) ---------- */
async function issueLink(registrationId: string): Promise<{ link: string; expires_at: string }> {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const serviceKey = getDefaultKey('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEYS');
    const siteUrl = (Deno.env.get('SITE_URL') || '').replace(/\/+$/, '');
    if (!supabaseUrl || !serviceKey || !siteUrl) throw new HttpError('Registration link configuration is missing.', 500);

    const admin = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const token = newToken();
    const expiresAt = new Date(Date.now() + TOKEN_TTL_HOURS * 3600 * 1000).toISOString();

    const { error: expireError } = await admin.from('registration_tokens')
        .update({ expires_at: new Date().toISOString() })
        .eq('registration_id', registrationId)
        .is('used_at', null);
    if (expireError) throw new HttpError('Could not expire older registration links.', 500);

    const { error: insertError } = await admin.from('registration_tokens').insert({
        registration_id: registrationId,
        token_hash: await sha256Hex(token),
        expires_at: expiresAt,
    });
    if (insertError) throw new HttpError('Could not create the registration link.', 500);

    return { link: `${siteUrl}/verify-otp.html?token=${encodeURIComponent(token)}`, expires_at: expiresAt };
}

/* ---------- request handler ---------- */
Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
    if (req.method !== 'POST') return reply({ ok: false, error: 'Method not allowed.' }, 405);

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const serviceKey = getDefaultKey('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEYS');
        const anonKey = getDefaultKey('SUPABASE_ANON_KEY', 'SUPABASE_PUBLISHABLE_KEYS');
        const siteUrl = (Deno.env.get('SITE_URL') || '').replace(/\/+$/, '');
        const intakeSecret = Deno.env.get('INTAKE_SECRET') || '';

        if (!supabaseUrl || !serviceKey || !anonKey) {
            throw new HttpError('Supabase environment keys are missing.', 500);
        }

        const admin = createClient(supabaseUrl, serviceKey, {
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        });

        // Fresh public client per operation. No user session is persisted in the Edge Function.
        const anon = () => createClient(supabaseUrl, anonKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
                flowType: 'implicit',
            },
        });

        // Store the session_id from the exact Auth session that passed OTP.
        // RLS checks this row before allowing protected browser queries.
        async function recordVerifiedSession(accessToken: string, userId: string): Promise<void> {
            const claims = decodeJwtPayload(accessToken);
            const sessionId = String(claims.session_id || '');
            const subject = String(claims.sub || '');

            if (!sessionId || subject !== userId) {
                throw new HttpError('Could not identify the verified login session.', 500);
            }

            const { error } = await admin.from('login_otp_sessions').upsert({
                session_id: sessionId,
                user_id: userId,
                verified_at: new Date().toISOString(),
            }, { onConflict: 'session_id' });

            if (error) {
                console.error('recordVerifiedSession failed:', error.message);
                throw new HttpError('Could not save the verified login session.', 500);
            }
        }

        // Verify that a registration link is valid and still belongs to a pending registration.
        async function checkToken(rawToken: unknown): Promise<
            | { ok: true; tok: any; reg: any }
            | { ok: false; code: string }
        > {
            const token = String(rawToken || '');
            if (token.length < 20 || token.length > 200) return { ok: false, code: 'invalid' };

            const { data: tok, error: tokenError } = await admin
                .from('registration_tokens')
                .select('*')
                .eq('token_hash', await sha256Hex(token))
                .maybeSingle();

            if (tokenError) throw new HttpError('Could not check the registration link.', 500);
            if (!tok) return { ok: false, code: 'invalid' };
            if (tok.used_at) return { ok: false, code: 'used' };
            if (new Date(tok.expires_at).getTime() < Date.now()) return { ok: false, code: 'expired' };
            if (Number(tok.failed_attempts || 0) >= MAX_VERIFY_ATTEMPTS) return { ok: false, code: 'locked' };

            const { data: reg, error: regError } = await admin
                .from('client_registrations')
                .select('*')
                .eq('id', tok.registration_id)
                .maybeSingle();

            if (regError) throw new HttpError('Could not load the registration.', 500);
            if (!reg || reg.status === 'cancelled') return { ok: false, code: 'invalid' };
            if (reg.status === 'verified') return { ok: false, code: 'used' };

            return { ok: true, tok, reg };
        }

        const body = await req.json().catch(() => ({} as Record<string, unknown>));
        const action = String((body as any).action || '');

        /* =============== INTAKE: GOOGLE APPS SCRIPT =============== */
        if (action === 'intake') {
            const suppliedSecret = req.headers.get('x-intake-secret') || '';
            if (!intakeSecret || !timingSafeEqual(suppliedSecret, intakeSecret)) {
                throw new HttpError('Unauthorized.', 401);
            }
            if (!siteUrl) throw new HttpError('SITE_URL is not configured.', 500);

            const responseId = text((body as any).response_id, 200);
            const fullName = text((body as any).full_name, 120);
            const email = text((body as any).email, 254).toLowerCase();
            const phone = text((body as any).phone, 30);

            if (!responseId) throw new HttpError('Missing response_id.');
            if (fullName.length < 2) throw new HttpError('Full name is required.');
            if (!EMAIL_RE.test(email)) throw new HttpError('A valid email address is required.');
            if (!/^[0-9+\-()\s]{7,30}$/.test(phone)) throw new HttpError('A valid contact number is required.');

            const rawDetails = (body as any).details && typeof (body as any).details === 'object'
                ? (body as any).details
                : {};
            const details: Record<string, string> = {};
            for (const key of ['institution', 'branch', 'unit', 'address', 'sex', 'check_in', 'reg_id']) {
                if (rawDetails[key] != null && String(rawDetails[key]).trim() !== '') {
                    details[key] = text(rawDetails[key], 300);
                }
            }

            const { data: bySame, error: sameError } = await admin
                .from('client_registrations')
                .select('id, status, reference')
                .eq('form_response_id', responseId)
                .maybeSingle();
            if (sameError) throw new HttpError('Could not check the submitted response.', 500);

            const { data: byEmail, error: emailError } = await admin
                .from('client_registrations')
                .select('id, status, reference')
                .eq('email', email)
                .in('status', ['pending', 'verified'])
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (emailError) throw new HttpError('Could not check the existing registration.', 500);

            const existing = bySame || byEmail;
            if (existing) {
                if (existing.status === 'verified') {
                    return reply({ ok: true, status: 'duplicate_verified', reference: existing.reference });
                }

                // A retry of the same Google Form response can get a fresh link immediately.
                // A second response for the same email is throttled for a few minutes.
                if (!bySame) {
                    const { data: last, error: lastError } = await admin
                        .from('registration_tokens')
                        .select('created_at')
                        .eq('registration_id', existing.id)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    if (lastError) throw new HttpError('Could not check the previous registration link.', 500);

                    if (last && Date.now() - new Date(last.created_at).getTime() < RELINK_MIN_MINUTES * 60000) {
                        return reply({ ok: true, status: 'duplicate_recent', reference: existing.reference });
                    }
                }

                const { link, expires_at } = await issueLink(existing.id);
                return reply({ ok: true, status: 'duplicate_resent', reference: existing.reference, link, expires_at });
            }

            const { data: created, error: insertError } = await admin
                .from('client_registrations')
                .insert({
                    reference: newReference(),
                    form_response_id: responseId,
                    email,
                    full_name: fullName,
                    phone,
                    details,
                })
                .select('id, reference')
                .single();

            if (insertError) {
                if (insertError.code === '23505') return reply({ ok: true, status: 'duplicate_recent' });
                console.error('client_registrations insert failed:', insertError.message);
                throw new HttpError('Could not save the registration.', 500);
            }

            const { link, expires_at } = await issueLink(created.id);
            return reply({ ok: true, status: 'created', reference: created.reference, link, expires_at });
        }

        /* =============== START LOGIN: PASSWORD THEN OTP =============== */
        if (action === 'start_login') {
            const email = text((body as any).email, 254).toLowerCase();
            const password = String((body as any).password || '');
            if (!EMAIL_RE.test(email) || !password || password.length > 1024) return fail('invalid_credentials');

            // Validate password using Auth, but NEVER return this temporary password-auth session.
            const passwordClient = anon();
            const { data: passwordData, error: passwordError } = await passwordClient.auth.signInWithPassword({
                email,
                password,
            });

            if (passwordError || !passwordData?.user) {
                const message = String(passwordError?.message || '').toLowerCase();
                if (message.includes('not confirmed')) return fail('email_not_confirmed');
                if (passwordError?.status === 429 || message.includes('rate') || message.includes('too many')) {
                    return fail('email_rate_limited');
                }
                return fail('invalid_credentials');
            }

            const userId = passwordData.user.id;
            const registeredEmail = String(passwordData.user.email || email).trim().toLowerCase();
            if (!EMAIL_RE.test(registeredEmail)) return fail('invalid_credentials');

            // Revoke only the temporary session created for this password check.
            // This does not sign the account out from other browsers/devices.
            await passwordClient.auth.signOut({ scope: 'local' }).catch(() => ({ error: null }));

            // Invalidate older unconsumed challenges for this user. Only the newest challenge remains usable.
            const now = new Date().toISOString();
            const { error: invalidateError } = await admin
                .from('login_otp_challenges')
                .update({ consumed_at: now })
                .eq('user_id', userId)
                .is('consumed_at', null);
            if (invalidateError) throw new HttpError('Could not prepare the login verification.', 500);

            const challengeId = newToken();
            const challengeHash = await sha256Hex(challengeId);
            const expiresAt = new Date(Date.now() + LOGIN_OTP_TTL_MINUTES * 60000).toISOString();

            const { error: challengeError } = await admin.from('login_otp_challenges').insert({
                challenge_hash: challengeHash,
                user_id: userId,
                email: registeredEmail,
                expires_at: expiresAt,
                send_count: 0,
                failed_attempts: 0,
            });
            if (challengeError) {
                console.error('login_otp_challenges insert failed:', challengeError.message);
                throw new HttpError('Could not create the login verification challenge.', 500);
            }

            // Existing accounts only. This must not create a new account during login.
            const { error: sendError } = await anon().auth.signInWithOtp({
                email: registeredEmail,
                options: { shouldCreateUser: false },
            });

            if (sendError) {
                await admin.from('login_otp_challenges').delete().eq('challenge_hash', challengeHash);
                const message = String(sendError.message || '').toLowerCase();
                if (sendError.status === 429 || message.includes('rate') || message.includes('seconds') || message.includes('too many')) {
                    return fail('email_rate_limited');
                }
                if (message.includes('not confirmed')) return fail('email_not_confirmed');
                console.error('login signInWithOtp failed:', sendError.message);
                return fail('send_failed');
            }

            const { error: sentUpdateError } = await admin.from('login_otp_challenges').update({
                send_count: 1,
                last_sent_at: new Date().toISOString(),
            }).eq('challenge_hash', challengeHash);
            if (sentUpdateError) throw new HttpError('OTP was sent, but the challenge could not be updated.', 500);

            return reply({
                ok: true,
                challenge_id: challengeId,
                masked_email: maskEmail(registeredEmail),
                retry_after: LOGIN_OTP_COOLDOWN_SECONDS,
            });
        }

        /* =============== RESEND LOGIN OTP =============== */
        if (action === 'resend_login_otp') {
            const challengeId = String((body as any).challenge_id || '');
            if (challengeId.length < 20 || challengeId.length > 200) return fail('invalid_challenge');

            const challengeHash = await sha256Hex(challengeId);
            const { data: challenge, error: challengeError } = await admin
                .from('login_otp_challenges')
                .select('*')
                .eq('challenge_hash', challengeHash)
                .maybeSingle();
            if (challengeError) throw new HttpError('Could not load the login challenge.', 500);
            if (!challenge || challenge.consumed_at) return fail('invalid_challenge');
            if (new Date(challenge.expires_at).getTime() < Date.now()) return fail('challenge_expired');
            if (Number(challenge.failed_attempts || 0) >= LOGIN_OTP_MAX_ATTEMPTS) return fail('locked');
            if (Number(challenge.send_count || 0) >= LOGIN_OTP_MAX_SENDS) return fail('too_many_sends');

            if (challenge.last_sent_at) {
                const elapsed = Math.floor((Date.now() - new Date(challenge.last_sent_at).getTime()) / 1000);
                if (elapsed < LOGIN_OTP_COOLDOWN_SECONDS) {
                    return fail('cooldown', { retry_after: LOGIN_OTP_COOLDOWN_SECONDS - elapsed });
                }
            }

            const { error: sendError } = await anon().auth.signInWithOtp({
                email: challenge.email,
                options: { shouldCreateUser: false },
            });
            if (sendError) {
                const message = String(sendError.message || '').toLowerCase();
                if (sendError.status === 429 || message.includes('rate') || message.includes('seconds') || message.includes('too many')) {
                    return fail('email_rate_limited');
                }
                console.error('resend login OTP failed:', sendError.message);
                return fail('send_failed');
            }

            const { error: updateError } = await admin.from('login_otp_challenges').update({
                send_count: Number(challenge.send_count || 0) + 1,
                last_sent_at: new Date().toISOString(),
            }).eq('id', challenge.id);
            if (updateError) throw new HttpError('OTP was sent, but the challenge could not be updated.', 500);

            return reply({ ok: true, retry_after: LOGIN_OTP_COOLDOWN_SECONDS });
        }

        /* =============== VERIFY LOGIN OTP =============== */
        if (action === 'verify_login_otp') {
            const challengeId = String((body as any).challenge_id || '');
            const code = String((body as any).code || '').trim();
            if (!/^\d{6}$/.test(code)) return fail('bad_code_format');
            if (challengeId.length < 20 || challengeId.length > 200) return fail('invalid_challenge');

            const challengeHash = await sha256Hex(challengeId);
            const { data: challenge, error: challengeError } = await admin
                .from('login_otp_challenges')
                .select('*')
                .eq('challenge_hash', challengeHash)
                .maybeSingle();
            if (challengeError) throw new HttpError('Could not load the login challenge.', 500);
            if (!challenge || challenge.consumed_at) return fail('invalid_challenge');
            if (new Date(challenge.expires_at).getTime() < Date.now()) return fail('challenge_expired');
            if (Number(challenge.failed_attempts || 0) >= LOGIN_OTP_MAX_ATTEMPTS) return fail('locked');

            const { data: verified, error: verifyError } = await anon().auth.verifyOtp({
                email: challenge.email,
                token: code,
                type: 'email',
            });

            if (verifyError || !verified?.session || !verified?.user || verified.user.id !== challenge.user_id) {
                const attempts = Number(challenge.failed_attempts || 0) + 1;
                const { error: attemptsError } = await admin.from('login_otp_challenges')
                    .update({ failed_attempts: attempts })
                    .eq('id', challenge.id)
                    .is('consumed_at', null);
                if (attemptsError) throw new HttpError('Could not record the unsuccessful OTP attempt.', 500);
                if (attempts >= LOGIN_OTP_MAX_ATTEMPTS) return fail('locked');
                return fail('otp_invalid', { attempts_left: LOGIN_OTP_MAX_ATTEMPTS - attempts });
            }

            if (String(verified.user.email || '').toLowerCase() !== String(challenge.email).toLowerCase()) {
                return fail('invalid_challenge');
            }

            // Consume the challenge once, before authorizing the exact newly-created session.
            const { data: consumed, error: consumeError } = await admin.from('login_otp_challenges')
                .update({ consumed_at: new Date().toISOString() })
                .eq('id', challenge.id)
                .is('consumed_at', null)
                .select('id');
            if (consumeError || !consumed || consumed.length === 0) return fail('invalid_challenge');

            await recordVerifiedSession(verified.session.access_token, verified.user.id);

            return reply({
                ok: true,
                access_token: verified.session.access_token,
                refresh_token: verified.session.refresh_token,
            });
        }

        /* =============== LOOKUP: REGISTRATION LINK =============== */
        if (action === 'lookup') {
            const result = await checkToken((body as any).token);
            if (!result.ok) return fail(result.code);
            const { tok, reg } = result;

            const wait = tok.otp_last_sent_at
                ? Math.max(0, OTP_COOLDOWN_SECONDS - Math.floor((Date.now() - new Date(tok.otp_last_sent_at).getTime()) / 1000))
                : 0;

            return reply({
                ok: true,
                masked_email: maskEmail(reg.email),
                first_name: String(reg.full_name || '').split(' ')[0],
                code_sent: Number(tok.otp_send_count || 0) > 0,
                retry_after: wait,
            });
        }

        /* =============== SEND REGISTRATION OTP =============== */
        if (action === 'send_otp') {
            const result = await checkToken((body as any).token);
            if (!result.ok) return fail(result.code);
            const { tok, reg } = result;

            if (tok.otp_last_sent_at) {
                const elapsed = Math.floor((Date.now() - new Date(tok.otp_last_sent_at).getTime()) / 1000);
                if (elapsed < OTP_COOLDOWN_SECONDS) return fail('cooldown', { retry_after: OTP_COOLDOWN_SECONDS - elapsed });
            }
            if (Number(tok.otp_send_count || 0) >= MAX_OTP_SENDS) return fail('too_many_sends');

            const { error: sendError } = await anon().auth.signInWithOtp({
                email: reg.email,
                options: { shouldCreateUser: true },
            });
            if (sendError) {
                const message = String(sendError.message || '').toLowerCase();
                if (sendError.status === 429 || message.includes('rate') || message.includes('seconds') || message.includes('too many')) {
                    return fail('email_rate_limited');
                }
                if (message.includes('invitation only')) return fail('invite_only_blocked');
                console.error('registration signInWithOtp failed:', sendError.message);
                return fail('send_failed');
            }

            const { error: updateError } = await admin.from('registration_tokens').update({
                otp_last_sent_at: new Date().toISOString(),
                otp_send_count: Number(tok.otp_send_count || 0) + 1,
            }).eq('id', tok.id);
            if (updateError) throw new HttpError('OTP was sent, but the registration token could not be updated.', 500);

            return reply({ ok: true, retry_after: OTP_COOLDOWN_SECONDS });
        }

        /* =============== VERIFY REGISTRATION OTP =============== */
        if (action === 'verify_otp') {
            const code = String((body as any).code || '').trim();
            if (!/^\d{6}$/.test(code)) return fail('bad_code_format');

            const result = await checkToken((body as any).token);
            if (!result.ok) return fail(result.code);
            const { tok, reg } = result;

            const { data: verified, error: verifyError } = await anon().auth.verifyOtp({
                email: reg.email,
                token: code,
                type: 'email',
            });

            if (verifyError || !verified?.session || !verified?.user) {
                const attempts = Number(tok.failed_attempts || 0) + 1;
                const { error: attemptsError } = await admin.from('registration_tokens')
                    .update({ failed_attempts: attempts })
                    .eq('id', tok.id)
                    .is('used_at', null);
                if (attemptsError) throw new HttpError('Could not record the unsuccessful OTP attempt.', 500);
                if (attempts >= MAX_VERIFY_ATTEMPTS) return fail('locked');
                return fail('otp_invalid', { attempts_left: MAX_VERIFY_ATTEMPTS - attempts });
            }

            if (String(verified.user.email || '').toLowerCase() !== String(reg.email).toLowerCase()) {
                return fail('invalid');
            }

            /* --- Create or complete the client profile --- */
            const details = (reg.details || {}) as Record<string, string>;
            const sexRaw = String(details.sex || '').trim().toLowerCase();
            const gender = ['male', 'm', 'man'].includes(sexRaw)
                ? 'Male'
                : ['female', 'f', 'woman'].includes(sexRaw)
                    ? 'Female'
                    : null;
            const numericId = /(\d+)$/.exec(details.reg_id || '');

            const wanted: Record<string, unknown> = {
                full_name: reg.full_name,
                phone: reg.phone,
                institution: details.institution || null,
                branch: details.branch || null,
                unit: details.unit || null,
                address: details.address || null,
                gender,
                check_in: /^\d{4}-\d{2}-\d{2}$/.test(details.check_in || '') ? details.check_in : null,
                reg_id: details.reg_id || null,
                guest_id: numericId ? `TR-${numericId[1].padStart(4, '0')}` : `TR-${Date.now()}`,
            };

            const { data: current, error: currentError } = await admin.from('profiles')
                .select('*')
                .eq('id', verified.user.id)
                .maybeSingle();
            if (currentError) throw new HttpError('Could not load the client profile.', 500);

            const profile: Record<string, unknown> = { id: verified.user.id };
            for (const [key, value] of Object.entries(wanted)) {
                // Preserve any non-empty data already maintained by staff/admin.
                if (value !== null && value !== '' && (!current || current[key] == null || current[key] === '')) {
                    profile[key] = value;
                }
            }
            profile.registration_id = reg.id;
            profile.registration_status = 'verified';

            const { error: profileError } = await admin.from('profiles')
                .upsert(profile, { onConflict: 'id' });
            if (profileError) {
                console.error('profile upsert failed:', profileError.message);
                return fail('profile_failed');
            }

            // Record this exact OTP-verified session so the RLS OTP gate allows it.
            await recordVerifiedSession(verified.session.access_token, verified.user.id);

            // Claim this link once. If another request already claimed it, do not return a session.
            const { data: claimed, error: claimError } = await admin.from('registration_tokens')
                .update({ used_at: new Date().toISOString() })
                .eq('id', tok.id)
                .is('used_at', null)
                .select('id');
            if (claimError || !claimed || claimed.length === 0) return fail('used');

            const { error: registrationUpdateError } = await admin.from('client_registrations').update({
                status: 'verified',
                user_id: verified.user.id,
                verified_at: new Date().toISOString(),
            }).eq('id', reg.id);
            if (registrationUpdateError) throw new HttpError('Your code was verified, but registration status could not be updated.', 500);

            return reply({
                ok: true,
                access_token: verified.session.access_token,
                refresh_token: verified.session.refresh_token,
            });
        }

        throw new HttpError('Unknown action.', 400);
    } catch (error) {
        const status = error instanceof HttpError ? error.status : 500;
        const message = error instanceof Error ? error.message : 'Something went wrong.';
        if (!(error instanceof HttpError)) console.error('registration function error:', error);
        return reply({ ok: false, error: message }, status);
    }
});
