import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../frontend/src/app/StrokeOrderViewer.tsx", import.meta.url), "utf8");

assert.doesNotMatch(source, /stroke-order-tool-trigger/);
assert.doesNotMatch(source, /const \[expanded/);
assert.doesNotMatch(source, /scrollAfterExpandRef/);
assert.doesNotMatch(source, /openLearningTool/);
assert.doesNotMatch(source, /closeLearningTool/);
assert.match(source, /className="stroke-order-panel is-expanded"/);
assert.match(source, /className="stroke-order-progress" role="status" aria-live="polite"/);
assert.match(source, /data-stroke-order-open="true"/);

const app = await readFile(new URL("../frontend/src/app/App.tsx", import.meta.url), "utf8");
assert.match(app, /mnemonicDialogRef=useModalDialog\(mnemonicEditing,closeMnemonicEditor\)/);
assert.match(app, /className="dialog secondary-page-dialog mnemonic-edit-dialog"/);
assert.match(app, /id="personal-mnemonic-textarea" autoFocus value=\{mnemonicDraft\} rows=\{7\} maxLength=\{600\}/);
assert.match(app, /aria-controls="personal-mnemonic-editor"/);
assert.doesNotMatch(app, /mnemonicToolRef|scrollMnemonicEditorIntoView/);
assert.doesNotMatch(app, /mnemonicEditing\?" is-open"/);

const enhancementStyles = await readFile(new URL("../frontend/src/app/learning-card-enhancements.css", import.meta.url), "utf8");
assert.match(enhancementStyles, /\.mnemonic-edit-dialog \.mnemonic-editor textarea/);
assert.match(enhancementStyles, /min-height:\s*220px/);
assert.match(enhancementStyles, /\.kanji-structure-dialog\.dialog\.secondary-page-dialog/);
assert.match(enhancementStyles, /\.learning-card \.learning-card-back \.stroke-order-controls\{grid-template-columns:minmax\(0,1fr\) minmax\(104px,auto\) minmax\(0,1fr\)/);
const styles = await readFile(new URL("../frontend/src/styles.css", import.meta.url), "utf8");
assert.match(styles, /\.kanji-structure-preview-action,.kanji-structure-preview-action-placeholder\{min-height:44px;\}/);
assert.match(styles, /\.learning-card-back \.learning-back-overview,/);
assert.match(styles, /\.learning-card\[data-card-density="dense"\] \.learning-back-overview/);
assert.match(styles, /grid-template-columns:minmax\(0,1fr\);/);
assert.doesNotMatch(styles, /\.learning-card\[data-card-density="dense"\] \.learning-back-overview\{[^}]*grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/);

const e2e = await readFile(new URL("../e2e/react-learning-card-flip.spec.mjs", import.meta.url), "utf8");
assert.match(e2e, /learning card keeps the Stroke Order page directly open/);
assert.match(e2e, /learning card exposes four full-content back pages in Persian and English/);
assert.match(e2e, /learning card keeps the Stroke Order page directly open/);
assert.doesNotMatch(e2e, /stroke-order replay auto-scrolls the expanded viewer fully into view/);
assert.match(e2e, /personal mnemonic editor is a usable modal and cancel restores unsaved changes/);

console.log("Stroke-order interaction and learning-modal source contracts passed.");
