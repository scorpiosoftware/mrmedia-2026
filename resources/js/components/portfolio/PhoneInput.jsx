import { COUNTRIES } from '@/lib/countries';
import { ChevronDown, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * Phone number input with a searchable country dial-code picker.
 * `country` is an ISO code; `number` is the local part, digits only.
 */
export default function PhoneInput({
    country,
    number,
    onCountryChange,
    onNumberChange,
    required = false,
    inputClassName = '',
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const wrapperRef = useRef(null);
    const searchRef = useRef(null);

    const selected = COUNTRIES.find((c) => c.iso === country) ?? COUNTRIES[0];

    const q = query.trim().toLowerCase().replace(/^\+/, '');
    const filtered = q
        ? COUNTRIES.filter(
              (c) =>
                  c.name.toLowerCase().includes(q) ||
                  c.dial.startsWith(q) ||
                  c.iso.toLowerCase() === q,
          )
        : COUNTRIES;

    useEffect(() => {
        if (!open) return;
        searchRef.current?.focus();
        const close = (e) => {
            if (!wrapperRef.current?.contains(e.target)) setOpen(false);
        };
        const onKey = (e) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const pick = (iso) => {
        onCountryChange(iso);
        setOpen(false);
        setQuery('');
    };

    return (
        <div ref={wrapperRef} className="relative flex gap-2" dir="ltr">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={`Country code: ${selected.name} +${selected.dial}`}
                className={`flex shrink-0 items-center gap-1.5 ${inputClassName}`}
            >
                <span className="text-base leading-none">{selected.flag}</span>
                <span>+{selected.dial}</span>
                <ChevronDown size={14} className="opacity-60" />
            </button>

            <input
                type="tel"
                name="phone"
                inputMode="tel"
                autoComplete="tel-national"
                value={number}
                onChange={(e) =>
                    onNumberChange(e.target.value.replace(/[^\d\s-]/g, ''))
                }
                required={required}
                pattern="[\d\s-]{4,20}"
                className={`min-w-0 flex-1 ${inputClassName}`}
            />

            {open && (
                <div className="absolute top-full left-0 z-20 mt-2 w-72 overflow-hidden rounded-xl border border-border bg-white shadow-[0_8px_32px_color-mix(in_srgb,var(--color-brand-blue)_15%,transparent)] dark:border-primary-light/50 dark:bg-brand-dark">
                    <div className="flex items-center gap-2 border-b border-secondary px-3 py-2 dark:border-primary-light/30">
                        <Search size={14} className="text-muted-foreground" />
                        <input
                            ref={searchRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (filtered[0]) pick(filtered[0].iso);
                                }
                            }}
                            placeholder="Search country or code"
                            className="w-full bg-transparent text-sm text-brand-dark outline-none placeholder:text-muted-foreground dark:text-white"
                        />
                    </div>
                    <ul
                        role="listbox"
                        className="max-h-60 overflow-y-auto py-1"
                    >
                        {filtered.map((c) => (
                            <li key={c.iso}>
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={c.iso === selected.iso}
                                    onClick={() => pick(c.iso)}
                                    className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary dark:hover:bg-primary-dark ${
                                        c.iso === selected.iso
                                            ? 'font-semibold text-brand-blue dark:text-brand-yellow'
                                            : 'text-brand-dark dark:text-white/80'
                                    }`}
                                >
                                    <span className="text-base leading-none">
                                        {c.flag}
                                    </span>
                                    <span className="flex-1 truncate">
                                        {c.name}
                                    </span>
                                    <span className="text-muted-foreground">
                                        +{c.dial}
                                    </span>
                                </button>
                            </li>
                        ))}
                        {filtered.length === 0 && (
                            <li className="px-3 py-2 text-sm text-muted-foreground">
                                No matches
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
