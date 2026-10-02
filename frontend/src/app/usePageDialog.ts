import { useEffect, useRef, type RefObject } from "react";

export function usePageDialog(open: boolean, onClose: () => void): RefObject<HTMLDialogElement | null> {
  const ref = useRef<HTMLDialogElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    let cancelled = false;
    let frame = 0;

    const focusDialog = () => {
      if (cancelled || !document.contains(dialog)) return;
      const focusTarget = dialog.querySelector<HTMLElement>(
        "[autofocus], .dialog-close, button, input, textarea, select, [tabindex]:not([tabindex='-1'])",
      );
      focusTarget?.focus();
    };

    const openWhenAttached = () => {
      if (cancelled) return;
      if (!document.contains(dialog)) {
        frame = requestAnimationFrame(openWhenAttached);
        return;
      }

      try {
        if (!dialog.open) dialog.showModal();
      } catch {
        if (document.contains(dialog)) dialog.setAttribute("open", "");
      }

      frame = requestAnimationFrame(() => {
        if (!cancelled) focusDialog();
      });
    };

    if (open) {
      openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      openWhenAttached();

      const onCancel = (event: Event) => {
        event.preventDefault();
        onClose();
      };
      dialog.addEventListener("cancel", onCancel);

      return () => {
        cancelled = true;
        cancelAnimationFrame(frame);
        dialog.removeEventListener("cancel", onCancel);
        if (dialog.open) {
          try {
            dialog.close();
          } catch {
            dialog.removeAttribute("open");
          }
        } else {
          dialog.removeAttribute("open");
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
    dialog.removeAttribute("open");

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
