export class DataverseHttpClient {
	constructor(
		private readonly baseUrl: string,
		private readonly accessToken: string
	) {}

	async get<T = unknown>(path: string): Promise<T> {
		const url = /^https?:\/\//i.test(path) ? path : `${this.baseUrl}${path}`;
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
				Accept: 'application/json',
				Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"',
				'OData-Version': '4.0',
				'OData-MaxVersion': '4.0'
			}
		});

		const text = await response.text();
		if (!response.ok) {
			throw new Error(`Dataverse error ${response.status} for GET ${url}: ${text}`);
		}

		return text.trim() ? JSON.parse(text) as T : {} as T;
	}

	async post<T = unknown>(path: string, body: unknown): Promise<T> {
		const url = /^https?:\/\//i.test(path) ? path : `${this.baseUrl}${path}`;
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.accessToken}`,
				Accept: 'application/json',
				'Content-Type': 'application/json',
				'OData-Version': '4.0',
				'OData-MaxVersion': '4.0'
			},
			body: JSON.stringify(body ?? {})
		});

		const text = await response.text();
		if (!response.ok) {
			throw new Error(`Dataverse error ${response.status} for POST ${url}: ${text}`);
		}

		return text.trim() ? JSON.parse(text) as T : { status: response.status } as T;
	}
}
