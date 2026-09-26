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

export function preparedMnemonicCoverage(catalog?: PreparedMnemonicCatalogItem[]): {
  total: number;
  curated: number;
  generated: number;
  coverage: number;
};
