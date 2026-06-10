import { EntityViewModel } from '../product/attributeFactoryTypes';
import { DataverseHttpClient } from './dataverseHttpClient';

type ODataList<T> = { value?: T[] };

type EntityMetadataRow = {
	LogicalName?: string;
	EntitySetName?: string;
	DisplayName?: { UserLocalizedLabel?: { Label?: string } };
};

type AttributeMetadataRow = {
	LogicalName?: string;
};

function encodeLogicalName(value: string): string {
	return value.replace(/'/g, "''");
}

function getDisplayLabel(row: EntityMetadataRow, fallback?: string): string | undefined {
	return row.DisplayName?.UserLocalizedLabel?.Label?.trim() || fallback;
}

export class AttributeMetadataClient {
	constructor(private readonly client: DataverseHttpClient) {}

	async listEntities(): Promise<EntityViewModel[]> {
		const response = await this.client.get<ODataList<EntityMetadataRow>>(
			'/EntityDefinitions?$select=LogicalName,EntitySetName,DisplayName'
		);

		return (response.value ?? [])
			.map((row): EntityViewModel | undefined => {
				const logicalName = row.LogicalName?.trim();
				if (!logicalName || !row.EntitySetName?.trim()) {
					return undefined;
				}
				return { logicalName, displayName: getDisplayLabel(row, logicalName) };
			})
			.filter((item): item is EntityViewModel => !!item)
			.sort((a, b) => (a.displayName ?? a.logicalName).localeCompare(b.displayName ?? b.logicalName, undefined, { sensitivity: 'base' }));
	}

	async attributeExists(entityLogicalName: string, attributeLogicalName: string): Promise<boolean> {
		const safeEntity = encodeLogicalName(entityLogicalName);
		const safeAttribute = encodeLogicalName(attributeLogicalName);
		try {
			await this.client.get<AttributeMetadataRow>(
				`/EntityDefinitions(LogicalName='${safeEntity}')/Attributes(LogicalName='${safeAttribute}')?$select=LogicalName`
			);
			return true;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			if (message.includes('404')) {
				return false;
			}
			throw error;
		}
	}
}
