import { exec, execFile } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

type AzureCliTokenResponse = {
	accessToken?: string;
	expiresOn?: string;
	expires_on?: string | number;
};

type CachedTokenEntry = {
	accessToken: string;
	expiresAtEpochMs: number;
};

const tokenRefreshBufferMs = 2 * 60 * 1000;
const fallbackTokenTtlMs = 50 * 60 * 1000;

let resolvedAzureCliPathPromise: Promise<string> | undefined;
const tokenCache = new Map<string, CachedTokenEntry>();
const inFlightTokenRequests = new Map<string, Promise<string>>();

function isWindows(): boolean {
	return process.platform === 'win32';
}

function buildTokenCacheKey(scope: string, tenantId?: string): string {
	return `${scope}::${tenantId?.trim() || ''}`;
}

function isTokenStillUsable(entry: CachedTokenEntry | undefined): entry is CachedTokenEntry {
	return !!entry && (entry.expiresAtEpochMs - tokenRefreshBufferMs) > Date.now();
}

function parseExpiresAtEpochMs(parsed: AzureCliTokenResponse): number {
	const expiresOnRaw = parsed.expires_on;

	if (typeof expiresOnRaw === 'number' && Number.isFinite(expiresOnRaw)) {
		return expiresOnRaw * 1000;
	}

	if (typeof expiresOnRaw === 'string') {
		const trimmed = expiresOnRaw.trim();
		if (/^\d+$/.test(trimmed)) {
			const asNumber = Number(trimmed);
			if (Number.isFinite(asNumber)) {
				return asNumber * 1000;
			}
		}

		const asDate = Date.parse(trimmed);
		if (!Number.isNaN(asDate)) {
			return asDate;
		}
	}

	if (typeof parsed.expiresOn === 'string' && parsed.expiresOn.trim()) {
		const asDate = Date.parse(parsed.expiresOn.trim());
		if (!Number.isNaN(asDate)) {
			return asDate;
		}
	}

	return Date.now() + fallbackTokenTtlMs;
}

async function resolveAzureCliPath(): Promise<string> {
	if (resolvedAzureCliPathPromise) {
		return resolvedAzureCliPathPromise;
	}

	resolvedAzureCliPathPromise = (async () => {
		if (!isWindows()) {
			return 'az';
		}

		try {
			const { stdout } = await execAsync('where az');
			const matches = stdout
				.split(/\r?\n/)
				.map((item: string) => item.trim())
				.filter(Boolean);

			const preferred =
				matches.find((item: string) => /az\.cmd$/i.test(item)) ??
				matches.find((item: string) => /az\.exe$/i.test(item)) ??
				matches[0];

			if (preferred) {
				return preferred;
			}
		} catch {
			// Continue to fallback paths.
		}

		const fallbackPaths = [
			String.raw`C:\Program Files\Microsoft SDKs\Azure\CLI2\wbin\az.cmd`,
			String.raw`C:\Program Files (x86)\Microsoft SDKs\Azure\CLI2\wbin\az.cmd`
		];

		for (const fallbackPath of fallbackPaths) {
			try {
				await execFileAsync('cmd', ['/c', 'if', 'exist', fallbackPath, 'echo', 'found']);
				return fallbackPath;
			} catch {
				// Continue.
			}
		}

		throw new Error('Azure CLI was not found. Install Azure CLI or ensure az is available in PATH.');
	})();

	return resolvedAzureCliPathPromise;
}

async function fetchAzureCliAccessToken(scope: string, tenantId?: string): Promise<string> {
	const azPath = await resolveAzureCliPath();
	const args = ['account', 'get-access-token', '--scope', scope, '-o', 'json'];

	if (tenantId?.trim()) {
		args.push('--tenant', tenantId.trim());
	}

	try {
		const result = isWindows() && azPath.toLowerCase().endsWith('.cmd')
			? await execAsync(`"${azPath}" ${args.map(arg => `"${arg.replace(/"/g, '\\"')}"`).join(' ')}`)
			: await execFileAsync(azPath, args);

		const raw = result.stdout?.toString().trim();
		if (!raw) {
			throw new Error('Azure CLI returned an empty response.');
		}

		const parsed = JSON.parse(raw) as AzureCliTokenResponse;
		const token = parsed.accessToken;
		if (!token) {
			throw new Error('Azure CLI response did not contain accessToken.');
		}

		const cacheKey = buildTokenCacheKey(scope, tenantId);
		tokenCache.set(cacheKey, {
			accessToken: token,
			expiresAtEpochMs: parseExpiresAtEpochMs(parsed)
		});

		return token;
	} catch (error: any) {
		const stderr = error?.stderr?.toString?.() ?? '';
		const stdout = error?.stdout?.toString?.() ?? '';
		const message = error?.message ?? String(error);
		throw new Error([
			'Azure CLI authentication failed.',
			`Command: ${azPath} ${args.join(' ')}`,
			stderr ? `STDERR: ${stderr}` : '',
			stdout ? `STDOUT: ${stdout}` : '',
			message ? `ERROR: ${message}` : ''
		].filter(Boolean).join('\n'));
	}
}

export async function getAzureCliAccessToken(scope: string, tenantId?: string): Promise<string> {
	const cacheKey = buildTokenCacheKey(scope, tenantId);
	const cached = tokenCache.get(cacheKey);
	if (isTokenStillUsable(cached)) {
		return cached.accessToken;
	}

	const inFlight = inFlightTokenRequests.get(cacheKey);
	if (inFlight) {
		return inFlight;
	}

	const requestPromise = fetchAzureCliAccessToken(scope, tenantId).finally(() => {
		inFlightTokenRequests.delete(cacheKey);
	});

	inFlightTokenRequests.set(cacheKey, requestPromise);
	return requestPromise;
}

export function clearAzureCliTokenCache(): void {
	tokenCache.clear();
	inFlightTokenRequests.clear();
}
