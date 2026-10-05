import { useEffect, useRef, useState } from "react";
import { createBackup, restoreBackup, type BackupSummary, type PortableBackup } from "./engine";
import { formatNumber, t, type Language } from "./i18n";

function summaryLabel(summary: BackupSummary, language: Language) {
  const format = (value: number) => formatNumber(value, language);
  return language === "fa"
    ? `${format(summary.cards)} کارت · ${format(summary.reviews)} مرور · ${format(summary.personalMnemonics)} یادسپار · ${format(summary.completedSessions)} جلسه`
    : `${format(summary.cards)} cards · ${format(summary.reviews)} reviews · ${format(summary.personalMnemonics)} mnemonics · ${format(summary.completedSessions)} sessions`;
}

function isPortableBackup(value: unknown): value is PortableBackup {
  if (!value || typeof value !== "object") return false;
  const backup = value as Partial<PortableBackup>;
  return backup.format === "kanji5-backup"
    && (Number(backup.version) === 1 || Number(backup.version) === 2)
    && typeof backup.createdAt === "string"
    && Boolean(backup.data)
    && Boolean(backup.metadata)
    && typeof backup.checksum === "string"
    && Boolean(backup.summary);
}

export function DataBackup({ language }: { language: Language }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [currentSummary, setCurrentSummary] = useState<BackupSummary | null>(null);
  const [lastBackupAt, setLastBackupAt] = useState("");
  const [busy, setBusy] = useState<"export" | "prepare-restore" | "restore" | "">("");
  const [candidate, setCandidate] = useState<PortableBackup | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let active = true;
    void createBackup().then(backup => {
      if (!active) return;
      setCurrentSummary(backup.summary);
    }).catch(() => {});
    try {
      setLastBackupAt(localStorage.getItem("kanji5-last-backup") || "");
    } catch {}
    return () => { active = false; };
  }, []);

  const exportData = async () => {
    if (busy) return;
    setBusy("export");
    setStatus("");
    try {
      const backup = await createBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const date = backup.createdAt.slice(0, 10) || "backup";
      anchor.href = url;
      anchor.download = `kanji5-backup-${date}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      try { localStorage.setItem("kanji5-last-backup", backup.createdAt); } catch {}
      setLastBackupAt(backup.createdAt);
      setCurrentSummary(backup.summary);
      setStatus(t("backupExported", language));
    } catch {
      setStatus(t("backupWriteError", language));
    } finally {
      setBusy("");
    }
  };

  const prepareRestore = async (file: File) => {
    if (busy) return;
    setBusy("prepare-restore");
    setStatus("");
    setCandidate(null);
    try {
      const raw = JSON.parse(await file.text()) as unknown;
      if (!isPortableBackup(raw)) throw new Error("INVALID");
      setCandidate(raw);
    } catch {
      setStatus(t("backupInvalid", language));
    } finally {
      setBusy("");
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const confirmRestore = async () => {
    if (!candidate || busy) return;
    setBusy("restore");
    setStatus("");
    try {
      await restoreBackup(candidate);
      setStatus(t("backupRestoreSuccess", language));
      window.setTimeout(() => window.location.reload(), 450);
    } catch (error) {
      const code = String(error instanceof Error ? error.message : error || "");
      setStatus(code === "KANJI5_INVALID_BACKUP" || code === "KANJI5_BACKUP_VERSION_UNSUPPORTED" ? t("backupInvalid", language) : t("backupWriteError", language));
      setCandidate(null);
      setBusy("");
      return;
    }
  };

  return (
    <section className="settings-data-backup">
      <div className="settings-backup-summary">
        <span>{language === "fa" ? "دادهٔ فعلی" : "Current data"}</span>
        <strong>{currentSummary ? summaryLabel(currentSummary, language) : (language === "fa" ? "در حال آماده‌سازی…" : "Preparing…")}</strong>
      </div>

      {lastBackupAt ? (
        <p className="settings-backup-last">
          {t("dataBackupLast", language)} · <span dir="ltr">{new Date(lastBackupAt).toLocaleString(language === "fa" ? "fa-IR" : "en-US", { dateStyle: "medium", timeStyle: "short" })}</span>
        </p>
      ) : (
        <p className="settings-backup-last">{t("dataBackupLast", language)} · {t("dataBackupNever", language)}</p>
      )}

      {!candidate ? (
        <div className="settings-backup-actions">
          <button className="button secondary" type="button" onClick={() => void exportData()} disabled={Boolean(busy)}>
            {busy === "export" ? "…" : t("exportBackup", language)}
          </button>
          <label className="button secondary settings-backup-import">
            {busy === "prepare-restore" ? "…" : t("restoreBackup", language)}
            <input ref={inputRef} type="file" accept=".json,application/json" disabled={Boolean(busy)} onChange={event => {
              const file = event.currentTarget.files?.[0];
              if (file) void prepareRestore(file);
            }} />
          </label>
        </div>
      ) : (
        <div className="settings-backup-confirmation" role="alert">
          <strong>{t("backupRestoreConfirmTitle", language)}</strong>
          <p>{t("backupRestoreConfirmHint", language)}</p>
          <p className="settings-backup-candidate-count">{summaryLabel(candidate.summary, language)}</p>
          <div className="settings-backup-confirm-actions">
            <button className="button secondary" type="button" onClick={() => setCandidate(null)} disabled={Boolean(busy)}>{t("backupRestoreCancel", language)}</button>
            <button className="button primary" type="button" onClick={() => void confirmRestore()} disabled={Boolean(busy)}>{busy === "restore" ? "…" : t("backupRestoreProceed", language)}</button>
          </div>
        </div>
      )}

      {status ? <p className="settings-data-backup-status" role="status">{status}</p> : null}
    </section>
  );
}
