import { useEffect, useRef, type RefObject } from "react";

export function useModalDialog(open: boolean, onClose: () => void): RefObject<HTMLDialogElement | null> {
  const ref = useRef<HTMLDialogElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const dialog = ref.current;
    if (!dialog) return;
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    const focusTarget = dialog.querySelector<HTMLElement>("[autofocus], .dialog-close, button, input, textarea, select, [tabindex]:not([tabindex='-1'])");
    requestAnimationFrame(() => focusTarget?.focus());
    return () => {
      if (dialog.open) dialog.close();
      const opener = openerRef.current;
      openerRef.current = null;
      requestAnimationFrame(() => {
        if (opener?.isConnected && !opener.hasAttribute("disabled") && opener.getAttribute("aria-hidden") !== "true") {
          opener.focus({ preventScroll: true });
        }
      });
    };
  }, [open]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };
    dialog.addEventListener("cancel", onCancel);
    return () => dialog.removeEventListener("cancel", onCancel);
  }, [onClose]);

  return ref;
}
