import { useEffect, useRef, type RefObject } from "react";

export function useModalDialog(open: boolean, onClose: () => void): RefObject<HTMLDialogElement | null> {
  const ref = useRef<HTMLDialogElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    const focusTarget = dialog.querySelector<HTMLElement>("[autofocus], .dialog-close, button, input, textarea, select, [tabindex]:not([tabindex='-1'])");
    requestAnimationFrame(() => focusTarget?.focus());
    const onCancel = (event: Event) => { event.preventDefault(); onClose(); };
    dialog.addEventListener("cancel", onCancel);
    return () => {
      dialog.removeEventListener("cancel", onCancel);
      if (dialog.open) dialog.close();
      requestAnimationFrame(() => openerRef.current?.focus());
    };
  }, [open, onClose]);

  return ref;
}
