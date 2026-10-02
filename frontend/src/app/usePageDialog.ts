import { useEffect, useRef, type RefObject } from "react";

export function usePageDialog(open: boolean, onClose: () => void): RefObject<HTMLDialogElement | null> {
  const ref = useRef<HTMLDialogElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !document.contains(dialog)) return;

    if (open) {
      openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

      if (!dialog.open) {
        try {
          dialog.showModal();
        } catch {
          if (document.contains(dialog)) dialog.setAttribute("open", "");
        }
      }

      const focusTarget = dialog.querySelector<HTMLElement>(
        "[autofocus], .dialog-close, button, input, textarea, select, [tabindex]:not([tabindex='-1'])",
      );
      requestAnimationFrame(() => {
        if (document.contains(dialog)) focusTarget?.focus();
      });

      const onCancel = (event: Event) => {
        event.preventDefault();
        onClose();
      };
      dialog.addEventListener("cancel", onCancel);

      return () => {
        dialog.removeEventListener("cancel", onCancel);
        if (dialog.open) {
          try {
            dialog.close();
          } catch {
            dialog.removeAttribute("open");
          }
        }
      };
    }

    if (dialog.open) {
      try {
        dialog.close();
      } catch {
        dialog.removeAttribute("open");
      }
    }
    const opener = openerRef.current;
    openerRef.current = null;
    if (opener && document.contains(opener)) {
      requestAnimationFrame(() => {
        if (document.contains(opener)) opener.focus({ preventScroll: true });
      });
    }
  }, [open, onClose]);

  return ref;
}
