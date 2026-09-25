import { useRef, useState } from "react";
import { getMnemonic, saveMnemonic, type KanjiCatalogItem } from "./engine";
import { formatNumber, t, type Language } from "./i18n";

type BackupEntry = { character: string; text: string };
type BackupPayload = { version: 1; exportedAt: string; mnemonics: BackupEntry[] };

const chunk = <T,>(items: T[], size: number) => {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
};

export function MnemonicBackup({ catalog, language }: { catalog: KanjiCatalogItem[]; language: Language }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState<"export" | "import" | "">("");
  const [status, setStatus] = useState("");

  const exportMnemonics = async () => {
    if (busy) return;
    setBusy("export");
    setStatus("");
    try {
      const rows: BackupEntry[] = [];
      for (const group of chunk(catalog, 24)) {
        const values = await Promise.all(group.map(async item => {
          try {
            const result = await getMnemonic(item.character);
            const text = String(result.text ?? "").trim();
            return text ? { character: item.character, text } : null;
          } catch {
            return null;
          }
        }));
        rows.push(...values.filter((value): value is BackupEntry => Boolean(value)));
      }
      const payload: BackupPayload = { version: 1, exportedAt: new Date().toISOString(), mnemonics: rows };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "kanji5-personal-mnemonics.json";
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus(language === "fa" ? `${formatNumber(rows.length, language)} یادسپار خروجی گرفته شد.` : `${formatNumber(rows.length, language)} personal mnemonics exported.`);
    } catch {
      setStatus(t("contentBackupError", language));
    } finally {
      setBusy("");
    }
  };

  const importMnemonics = async (file: File) => {
    if (busy) return;
    setBusy("import");
    setStatus("");
    try {
      const raw = JSON.parse(await file.text()) as Partial<BackupPayload>;
      if (raw.version !== 1 || !Array.isArray(raw.mnemonics)) throw new Error("INVALID_BACKUP");
      const allowed = new Map(catalog.map(item => [item.character, item.character]));
      const entries = raw.mnemonics
        .map(item => ({ character: String(item?.character ?? "").trim(), text: String(item?.text ?? "").trim().slice(0, 600) }))
        .filter(item => allowed.has(item.character) && item.text)
        .filter((item, index, values) => values.findIndex(value => value.character === item.character) === index);
      if (!entries.length) throw new Error("NO_VALID_ENTRIES");
      const replace = window.confirm(t("contentImportConfirm", language));
      if (!replace) return;
      let saved = 0;
      for (const group of chunk(entries, 12)) {
        await Promise.all(group.map(async entry => {
          try {
            await saveMnemonic(entry.character, entry.text);
            saved += 1;
          } catch {}
        }));
      }
      setStatus(language === "fa" ? `${formatNumber(saved, language)} یادسپار بازیابی شد.` : `${formatNumber(saved, language)} personal mnemonics restored.`);
    } catch {
      setStatus(t("contentBackupError", language));
    } finally {
      setBusy("");
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <section className="mnemonic-backup">
      <div>
        <h3>{t("contentBackup", language)}</h3>
        <p>{t("contentBackupHint", language)}</p>
      </div>
      <div className="mnemonic-backup-actions">
        <button className="button secondary" type="button" disabled={Boolean(busy)} onClick={() => void exportMnemonics()}>
          {busy === "export" ? "…" : t("exportContent", language)}
        </button>
        <label className="button secondary mnemonic-import-button">
          {busy === "import" ? "…" : t("importContent", language)}
          <input ref={inputRef} type="file" accept=".json,application/json" disabled={Boolean(busy)} onChange={event => {
            const file = event.currentTarget.files?.[0];
            if (file) void importMnemonics(file);
          }} />
        </label>
      </div>
      <div className="mnemonic-backup-scope">{t("contentBackupScope", language)}</div>
      {status ? <p className="mnemonic-backup-status" role="status">{status}</p> : null}
    </section>
  );
}
