import { env } from '$env/dynamic/private';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';
import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { genericOAuth } from 'better-auth/plugins';

const memoryDb = {
	user: [],
	session: [],
	account: [],
	verification: []
};

const supabaseUrl = env.SUPABASE_URL ?? PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

const deploymentUrl = env.BETTER_AUTH_URL ?? (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : undefined);

let deploymentHost: string | null = null;
let deploymentOrigin: string | null = null;
let deploymentProtocol: 'http' | 'https' = 'http';

if (deploymentUrl) {
	try {
		const parsed = new URL(deploymentUrl);
		deploymentHost = parsed.host;
		deploymentOrigin = parsed.origin;
		deploymentProtocol = parsed.protocol === 'https:' ? 'https' : 'http';
	} catch {
		console.warn('BETTER_AUTH_URL is not a valid URL; falling back to localhost auth host settings.');
	}
}

const allowedHosts = ['localhost', '127.0.0.1', ...(deploymentHost ? [deploymentHost] : [])];

const trustedOrigins = [
	env.BETTER_AUTH_URL,
	deploymentOrigin,
	'http://localhost:5173',
	'http://127.0.0.1:5173',
	'http://localhost:5137',
	'http://127.0.0.1:5137'
].filter((origin): origin is string => Boolean(origin));

const supabaseAdmin =
	supabaseUrl && supabaseServiceRoleKey
		? createClient(supabaseUrl, supabaseServiceRoleKey, {
			auth: {
				autoRefreshToken: false,
				persistSession: false
			}
		})
		: null;

function decodeJwtPayload(token: string | null | undefined): Record<string, unknown> {
	if (!token) return {};

	try {
		const parts = token.split('.');
		if (parts.length < 2) return {};
		const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
		return JSON.parse(payload) as Record<string, unknown>;
	} catch {
		return {};
	}
}

export const auth = betterAuth({
	secret: env.BETTER_AUTH_SECRET,
	baseURL: {
		allowedHosts,
		fallback: env.BETTER_AUTH_URL,
		protocol: deploymentProtocol
	},
	trustedOrigins,
	databaseHooks: {
		session: {
			create: {
				after: async (session, hookContext) => {
					if (!hookContext) return;

					const user = await hookContext.context.internalAdapter.findUserById(session.userId);
					if (!user) return;

					const accounts = await hookContext.context.internalAdapter.findAccountByUserId(user.id);
					const hackclubAccount = accounts.find((account) => account.providerId === 'hackclub');
					if (!hackclubAccount) return;

					const claims = decodeJwtPayload(hackclubAccount.idToken);
					const hackclubSub = (claims.sub as string | undefined) ?? hackclubAccount.accountId;
					const slackId = (claims.slack_id as string | undefined) ?? null;
					const avatarUrl = slackId ? `https://cachet.dunkirk.sh/users/${encodeURIComponent(slackId)}/r` : null;

					if (!hackclubSub) return;

					if (avatarUrl && user.image !== avatarUrl) {
						await hookContext.context.internalAdapter.updateUser(user.id, { image: avatarUrl });
					}

					if (!supabaseAdmin) {
						console.error('Skipping profile sync: SUPABASE_URL/PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing');
						return;
					}

					const profile = {
						hackclub_sub: hackclubSub,
						email: (claims.email as string | undefined) ?? user.email ?? null,
						name: (claims.name as string | undefined) ?? user.name ?? null,
						given_name: (claims.given_name as string | undefined) ?? null,
						family_name: (claims.family_name as string | undefined) ?? null,
						slack_id: slackId,
						verification_status: (claims.verification_status as string | undefined) ?? null,
						ysws_eligible: (claims.ysws_eligible as boolean | undefined) ?? null,
						avatar_url: avatarUrl,
						raw_claims: claims,
						last_login_at: new Date().toISOString()
					};

					const { error } = await supabaseAdmin
						.from('users')
						.upsert(profile, { onConflict: 'hackclub_sub' });

					if (error) {
						console.error('Failed to upsert user profile', error);
					} else {
						console.info('Synced user profile to Supabase users table', {
							hackclub_sub: profile.hackclub_sub,
							email: profile.email
						});
					}
				}
			}
		}
	},
	database: memoryAdapter(memoryDb),
	plugins: [
		genericOAuth({
			config: [
				{
					providerId: 'hackclub',
					discoveryUrl: 'https://auth.hackclub.com/.well-known/openid-configuration',
					clientId: env.HACKCLUB_CLIENT_ID,
					clientSecret: env.HACKCLUB_CLIENT_SECRET,
					scopes: ['openid', 'profile', 'email', 'slack_id', 'verification_status']
				}
			]
		})
	]
});