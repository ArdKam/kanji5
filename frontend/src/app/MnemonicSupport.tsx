import { useEffect, useState, type SyntheticEvent } from "react";
import type { Language } from "./i18n";
import "./mnemonic-support.css";
import { t } from "./i18n";
import { getMnemonicHintPlan, type MnemonicHintFocus, type MnemonicHintStage, type MnemonicSupport } from "./mnemonic-support";

export function MnemonicSupportPanel({ support, language, character, isNew = false, hintStage, hintFocus = "both" }: { support: MnemonicSupport; language: Language; character: string; isNew?: boolean; hintStage?: MnemonicHintStage; hintFocus?: MnemonicHintFocus }) {
  const stage = hintStage ?? (isNew ? "new" : "stable");
  const plan = getMnemonicHintPlan(stage,hintFocus);
  const presentationMode = plan.expandedByDefault ? "expanded" : "compact";
  const [expanded, setExpanded] = useState(plan.expandedByDefault);
  useEffect(() => {
    setExpanded(plan.expandedByDefault);
  }, [character, stage, plan.expandedByDefault]);
  if (stage === "mastered") return null;
  if (!support.readingMnemonic && !support.vocabularyBridge && !support.confusableCue) return null;

  const handleToggle = (event: SyntheticEvent<HTMLDetailsElement>) => setExpanded(event.currentTarget.open);

  return (
    <details className={"mnemonic-support mnemonic-support-" + presentationMode} data-hint-stage={stage} data-hint-focus={hintFocus} open={expanded} onToggle={handleToggle} aria-label={t("mnemonicBridges")}>
      <summary className="mnemonic-support-header">
        <strong>{t("mnemonicBridges")}</strong>
        <span>{t("mnemonicBridgesHint")}</span>
      </summary>

      <div className="mnemonic-support-content">

      {plan.showConfusable && support.confusableCue ? (
        <article className="mnemonic-support-item mnemonic-support-confusable">
          <div className="mnemonic-support-item-label">{t("lookalikeContrast")}</div>
          <div className="mnemonic-support-pair" lang="ja">{support.confusableCue.pair}</div>
          <p>{language === "fa" ? support.confusableCue.fa : support.confusableCue.en}</p>
        </article>
      ) : null}

      {plan.showReading && support.readingMnemonic ? (
        <article className="mnemonic-support-item">
          <div className="mnemonic-support-item-label">{t("readingMnemonic")}</div>
          <div className="mnemonic-support-reading-row">
            <strong className="mnemonic-support-reading" lang="ja">{support.readingMnemonic.reading}</strong>
            {support.readingMnemonic.keywordEn ? <span className="mnemonic-support-keyword" title={support.readingMnemonic.keywordFa}>{support.readingMnemonic.keywordEn}</span> : null}
            {support.readingMnemonic.word ? <span className="mnemonic-support-arrow" aria-hidden="true">↔</span> : null}
            {support.readingMnemonic.word ? <strong className="mnemonic-support-word" lang="ja">{support.readingMnemonic.word}</strong> : null}
          </div>
          <p>{language === "fa" ? support.readingMnemonic.fa : support.readingMnemonic.en}</p>
        </article>
      ) : null}

      {plan.showVocabulary && support.vocabularyBridge ? (
        <article className="mnemonic-support-item">
          <div className="mnemonic-support-item-label">{t("vocabulary")}</div>
          <div className="mnemonic-support-vocab-row">
            <strong lang="ja">{support.vocabularyBridge.word}</strong>
            {support.vocabularyBridge.reading ? <span lang="ja">（{support.vocabularyBridge.reading}）</span> : null}
            {support.vocabularyBridge.meaning ? <span>· {support.vocabularyBridge.meaning}</span> : null}
          </div>
          <p>{language === "fa" ? support.vocabularyBridge.fa : support.vocabularyBridge.en}</p>
        </article>
      ) : null}
      </div>
    </details>
  );
}
