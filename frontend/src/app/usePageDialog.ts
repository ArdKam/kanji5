import { useEffect, useRef, type RefObject } from "react";

export function usePageDialog(open: boolean, onClose: () => void): RefObject<HTMLDialogElement | null> {
  const ref = useRef<HTMLDialogElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    let frame = 0;

    if (open) {
      openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      frame = window.requestAnimationFrame(() => {
        if (!dialog.isConnected) return;
        if (!dialog.open) {
          try {
            dialog.showModal();
          } catch {
            if (dialog.isConnected) dialog.setAttribute("open", "");
          }
        }

        const focusTarget = dialog.querySelector<HTMLElement>(
          "[autofocus], .dialog-close, button, input, textarea, select, [tabindex]:not([tabindex='-1'])",
        );
        focusTarget?.focus();
      });

      const onCancel = (event: Event) => {
        event.preventDefault();
        onClose();
      };
      dialog.addEventListener("cancel", onCancel);

      return () => {
        window.cancelAnimationFrame(frame);
        dialog.removeEventListener("cancel", onCancel);
      };
    }

    if (dialog.open && dialog.isConnected) dialog.close();
    const opener = openerRef.current;
    openerRef.current = null;
    if (opener && document.contains(opener)) {
      frame = window.requestAnimationFrame(() => {
        if (document.contains(opener)) opener.focus({ preventScroll: true });
      });
    }

    return () => window.cancelAnimationFrame(frame);
  }, [open, onClose]);

  return ref;
}
