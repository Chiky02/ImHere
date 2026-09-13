/** Icon-only action controls for admin tables */
export function IconEdit({ label = "Editar" }: { label?: string }) {
  return (
    <span className="icon-action" title={label} aria-label={label}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M13.5 6.5l3 3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    </span>
  );
}

export function IconTrash({ label = "Eliminar" }: { label?: string }) {
  return (
    <span className="icon-action text-signal" title={label} aria-label={label}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 7h14M10 11v6M14 11v6M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function IconUser({ label = "Conductor" }: { label?: string }) {
  return (
    <span className="icon-action" title={label} aria-label={label}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M5 19.5c1.8-3.2 4-4.5 7-4.5s5.2 1.3 7 4.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function IconSave({ label = "Guardar" }: { label?: string }) {
  return (
    <span className="icon-action text-forest" title={label} aria-label={label}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M5 12.5l4.5 4.5L19 7.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
