"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action?: any;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  className?: string;
  children: ReactNode;
};

export function ConfirmForm({
  action,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "danger",
  className,
  children,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const dialog =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-end justify-center bg-[#0f2744]/50 p-4 sm:items-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-line bg-white p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="confirm-title" className="display text-xl text-ink">
                {title}
              </h2>
              <p className="mt-2 text-sm text-muted">{message}</p>
              <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="btn btn-ghost w-full sm:w-auto"
                  onClick={() => setOpen(false)}
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  className={
                    tone === "danger"
                      ? "btn w-full border-signal bg-signal text-white sm:w-auto"
                      : "btn btn-primary w-full sm:w-auto"
                  }
                  onClick={() => {
                    confirmedRef.current = true;
                    setOpen(false);
                    formRef.current?.requestSubmit();
                  }}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <form
        ref={formRef}
        action={action}
        className={className}
        onSubmit={(e) => {
          if (confirmedRef.current) {
            confirmedRef.current = false;
            return;
          }
          e.preventDefault();
          setOpen(true);
        }}
      >
        {children}
      </form>
      {dialog}
    </>
  );
}
