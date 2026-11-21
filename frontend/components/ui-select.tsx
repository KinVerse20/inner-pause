'use client';

import { useEffect, useRef, useState } from 'react';

export function UiSelect<T extends string>({ label, value, options, onChange, disabled = false }: {
  label: string; value: T; options: readonly { value: T; label: string }[]; onChange: (value: T) => void; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement | null>(null);
  const selected = options.find(option => option.value === value) ?? options[0];
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  return <div className="relative" ref={root}>
    <button type="button" disabled={disabled} aria-label={label} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(current => !current)} className="soft-input flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm disabled:opacity-50"><span>{selected.label}</span><span aria-hidden="true">{open ? '⌃' : '⌄'}</span></button>
    {open && <div role="listbox" aria-label={`${label} options`} className="absolute left-0 right-0 z-[100] mt-2 max-h-72 overflow-auto rounded-2xl border border-[var(--ip-border)] bg-white p-2 text-sm text-[var(--ip-ink)] shadow-2xl">{options.map(option => <button type="button" role="option" aria-selected={option.value === value} key={option.value} onClick={() => { onChange(option.value); setOpen(false); }} className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-[var(--ip-lavender)] focus:bg-[var(--ip-lavender)] focus:outline-none"><span>{option.label}</span>{option.value === value && <b className="text-[var(--ip-purple)]">✓</b>}</button>)}</div>}
  </div>;
}
