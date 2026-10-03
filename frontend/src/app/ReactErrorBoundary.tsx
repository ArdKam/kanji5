import { Component, type ErrorInfo, type ReactNode } from "react";
import { createBackup } from "./engine";
import { getLanguage, t, type Language } from "./i18n";

type Observability = {
  capture: (type: string, error: unknown, extra?: Record<string, unknown>) => unknown;
  list?: () => unknown[];
};
type State = { failed: boolean; backupBusy: boolean; copied: boolean };
const getObservability = () => (window as Window & { __KANJI5_OBSERVABILITY__?: Observability }).__KANJI5_OBSERVABILITY__;

function diagnosticsFor(error: Error, info: ErrorInfo) {
  const observability = getObservability();
  const captured = observability?.capture("react-render-error", error, {
    componentStack: info.componentStack ?? "",
  });
  return {
    release: captured?.release ?? document.querySelector('meta[name="kanji5-build-id"]')?.getAttribute("content") ?? "dev",
    path: location.pathname,
    error: { name: error.name || "Error", message: error.message || String(error) },
    componentStack: info.componentStack ?? "",
    recent: observability?.list?.().slice(-8) ?? [],
  };
}

function downloadBackup(backup: unknown, language: Language) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `kanji5-error-backup-${date}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  void language;
}

export class ReactErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false, backupBusy: false, copied: false };
  private error: Error | null = null;
  private errorInfo: ErrorInfo | null = null;

  static getDerivedStateFromError(error: Error) {
    return { failed: true, backupBusy: false, copied: false };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.error = error;
    this.errorInfo = info;
    diagnosticsFor(error, info);
  }

  private handleBackup = async () => {
    if (this.state.backupBusy) return;
    this.setState({ backupBusy: true });
    try {
      const backup = await createBackup();
      downloadBackup(backup, getLanguage());
    } catch (error) {
      getObservability()?.capture("react-error-backup-failed", error);
    } finally {
      this.setState({ backupBusy: false });
    }
  };

  private handleCopyReport = async () => {
    const error = this.error ?? new Error("Unknown React render failure");
    const info = this.errorInfo ?? { componentStack: "" } as ErrorInfo;
    const report = diagnosticsFor(error, info);
    const textValue = JSON.stringify(report, null, 2);
    try {
      await navigator.clipboard.writeText(textValue);
      this.setState({ copied: true });
    } catch {
      this.setState({ copied: false });
    }
  };

  render() {
    if (!this.state.failed) return this.props.children;
    const language = getLanguage();
    return (
      <div className="app-shell centered">
        <section className="surface fatal react-error-boundary" role="alert" aria-labelledby="react-error-title">
          <span className="fatal-kanji" lang="ja">迷</span>
          <h1 id="react-error-title">{t("runtimeFailureTitle", language)}</h1>
          <p>{t("runtimeFailureHint", language)}</p>
          <div className="fatal-actions">
            <button className="button primary" type="button" onClick={() => location.reload()}>
              {t("tryAgain", language)}
            </button>
            <button className="button secondary" type="button" onClick={() => void this.handleBackup()} disabled={this.state.backupBusy}>
              {this.state.backupBusy ? "…" : t("runtimeFailureBackup", language)}
            </button>
            <button className="button secondary" type="button" onClick={() => void this.handleCopyReport()}>
              {this.state.copied ? t("runtimeFailureCopied", language) : t("runtimeFailureReport", language)}
            </button>
          </div>
        </section>
      </div>
    );
  }
}
