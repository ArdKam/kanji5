export { CURATED_PREPARED_MNEMONICS as PREPARED_MNEMONICS, buildPreparedMnemonic, buildPreparedMnemonicEntries, preparedMnemonicCoverage, PREPARED_MNEMONIC_VERSION } from "./prepared-mnemonic-core.js";
export type PreparedMnemonic = {
  fa: string;
  en: string;
  source: "curated" | "generated";
};
