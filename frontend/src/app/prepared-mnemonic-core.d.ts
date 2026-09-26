export type PreparedMnemonic = {
  fa: string;
  en: string;
  source: "curated" | "generated";
};

export type PreparedMnemonicCatalogItem = {
  character?: string;
  id?: string;
  meaning?: string[];
  meanings?: string[];
};

export const PREPARED_MNEMONIC_VERSION: string;
export const CURATED_PREPARED_MNEMONICS: Readonly<Record<string, PreparedMnemonic[]>>;

export function buildPreparedMnemonic(item: PreparedMnemonicCatalogItem, components?: string[]): PreparedMnemonic;

export function buildPreparedMnemonicEntries(
  catalog?: PreparedMnemonicCatalogItem[],
  componentResolver?: ((character: string) => string[]) | null
): Array<{ character: string; suggestion: PreparedMnemonic }>;

export function scorePreparedMnemonic(entry: PreparedMnemonic, character?: string, components?: string[]): {
  source: "curated" | "generated" | "invalid";
  valid: boolean;
  minLength: boolean;
  concreteAnchorFa: boolean;
  concreteAnchorEn: boolean;
  characterConnected: boolean;
  componentConnected: boolean;
  genericTemplate: boolean;
};

export function preparedMnemonicQualityReport(
  catalog?: PreparedMnemonicCatalogItem[],
  componentResolver?: ((character: string) => string[]) | null
): {
  total: number;
  curated: number;
  generated: number;
  criticalFailures: number;
  genericTemplateLeaks: number;
  concreteAnchorFa: number;
  concreteAnchorEn: number;
  concreteAnchorFaRate: number;
  concreteAnchorEnRate: number;
  characterConnectedRate: number;
  componentConnectedRate: number;
  passes: boolean;
};

export function preparedMnemonicCoverage(catalog?: PreparedMnemonicCatalogItem[]): {
  total: number;
  curated: number;
  generated: number;
  coverage: number;
};
