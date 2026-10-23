import { useEffect, useRef, type RefObject } from "react";

export function usePageDialog(open: boolean, onClose: () => void): RefObject<HTMLDialogElement | null> {
  const ref = useRef<HTMLDialogElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open) {
      openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (!dialog.open) dialog.showModal();

      const focusTarget = dialog.querySelector<HTMLElement>(
        "[autofocus], .dialog-close, button, input, textarea, select, [tabindex]:not([tabindex='-1'])",
      );
      requestAnimationFrame(() => focusTarget?.focus());

      const onCancel = (event: Event) => {
        event.preventDefault();
        onClose();
      };
      dialog.addEventListener("cancel", onCancel);
      return () => {
        dialog.removeEventListener("cancel", onCancel);
      };
    }

    if (dialog.open) dialog.close();
    const opener = openerRef.current;
    openerRef.current = null;
    if (opener && document.contains(opener)) {
      requestAnimationFrame(() => opener.focus({ preventScroll: true }));
    }
  }, [open, onClose]);

  return ref;
}
