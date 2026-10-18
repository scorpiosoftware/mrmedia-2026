// Small form building blocks shared by admin settings pages (Scrolling Banner, Popup, …).

export const LABEL =
    'mb-2 block text-xs font-semibold tracking-wider text-[#213C93] uppercase';
export const INPUT =
    'w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-2.5 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none';

export function getCsrf() {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

export function Card({ title, subtitle, children }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-[#D1D5E8] bg-white">
            <div className="border-b border-[#E8EAF6] px-6 py-4">
                <h2 className="font-bold text-[#0D1B4B]">{title}</h2>
                {subtitle && (
                    <p className="mt-0.5 text-sm text-[#5A6A9A]">{subtitle}</p>
                )}
            </div>
            <div className="space-y-5 p-6">{children}</div>
        </div>
    );
}

export function Toggle({ checked, onChange, onLabel, offLabel }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`inline-flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                checked
                    ? 'border-[#213C93]/40 bg-[#213C93]/10 text-[#213C93]'
                    : 'border-[#D1D5E8] bg-[#F1F1F0] text-[#5A6A9A] hover:border-[#213C93]/40'
            }`}
        >
            <span
                className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-[#213C93]' : 'bg-[#D1D5E8]'}`}
            >
                <span
                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`}
                />
            </span>
            {checked ? onLabel : offLabel}
        </button>
    );
}

export function Segmented({ options, value, onChange }) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((o) => (
                <button
                    key={o.value}
                    type="button"
                    onClick={() => onChange(o.value)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                        value === o.value
                            ? 'bg-[#213C93] text-white'
                            : 'border border-[#D1D5E8] bg-white text-[#213C93] hover:border-[#213C93]'
                    }`}
                >
                    {o.Icon && <o.Icon size={13} />}
                    {o.label}
                </button>
            ))}
        </div>
    );
}
