import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';

/**
 * Generic admin repeater for array-of-object fields (agenda items, testimonials,
 * FAQs, trainer credentials, …). Each field can be `bilingual: true`, in which
 * case it renders `key` and `key + '_ar'` side by side.
 */
export default function RepeaterField({
    items = [],
    onChange,
    fields,
    emptyItem,
    addLabel = 'Add Item',
    itemLabel,
}) {
    const update = (index, patch) =>
        onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

    const remove = (index) => onChange(items.filter((_, i) => i !== index));

    const add = () => onChange([...items, { ...emptyItem }]);

    const move = (index, dir) => {
        const target = index + dir;
        if (target < 0 || target >= items.length) return;
        const next = [...items];
        [next[index], next[target]] = [next[target], next[index]];
        onChange(next);
    };

    return (
        <div className="space-y-3">
            {items.map((item, index) => (
                <div
                    key={index}
                    className="space-y-3 rounded-xl border border-[#D1D5E8] bg-white p-4"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#5A6A9A]">
                            {itemLabel ? itemLabel(item, index) : `Item ${index + 1}`}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => move(index, -1)}
                                disabled={index === 0}
                                className="rounded-lg p-1.5 text-[#5A6A9A] transition-colors hover:bg-[#F1F1F0] hover:text-[#213C93] disabled:opacity-30"
                            >
                                <ChevronUp size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => move(index, 1)}
                                disabled={index === items.length - 1}
                                className="rounded-lg p-1.5 text-[#5A6A9A] transition-colors hover:bg-[#F1F1F0] hover:text-[#213C93] disabled:opacity-30"
                            >
                                <ChevronDown size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => remove(index)}
                                className="rounded-lg p-1.5 text-[#5A6A9A] transition-colors hover:bg-red-50 hover:text-red-600"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>

                    {fields.map((field) => (
                        <div key={field.key}>
                            <label className="mb-1.5 block text-xs font-semibold text-[#5A6A9A]">
                                {field.label}
                            </label>
                            {field.bilingual ? (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {field.type === 'textarea' ? (
                                        <textarea
                                            value={item[field.key] ?? ''}
                                            onChange={(e) => update(index, { [field.key]: e.target.value })}
                                            rows={2}
                                            placeholder="🇬🇧 English"
                                            className="w-full resize-y rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-2.5 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            value={item[field.key] ?? ''}
                                            onChange={(e) => update(index, { [field.key]: e.target.value })}
                                            placeholder="🇬🇧 English"
                                            className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-2.5 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                        />
                                    )}
                                    {field.type === 'textarea' ? (
                                        <textarea
                                            dir="rtl"
                                            value={item[`${field.key}_ar`] ?? ''}
                                            onChange={(e) => update(index, { [`${field.key}_ar`]: e.target.value })}
                                            rows={2}
                                            placeholder="🇸🇦 Arabic"
                                            className="w-full resize-y rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-2.5 font-arabic text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            dir="rtl"
                                            value={item[`${field.key}_ar`] ?? ''}
                                            onChange={(e) => update(index, { [`${field.key}_ar`]: e.target.value })}
                                            placeholder="🇸🇦 Arabic"
                                            className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-2.5 font-arabic text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                        />
                                    )}
                                </div>
                            ) : field.type === 'textarea' ? (
                                <textarea
                                    value={item[field.key] ?? ''}
                                    onChange={(e) => update(index, { [field.key]: e.target.value })}
                                    rows={2}
                                    placeholder={field.placeholder}
                                    className="w-full resize-y rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-2.5 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={item[field.key] ?? ''}
                                    onChange={(e) => update(index, { [field.key]: e.target.value })}
                                    placeholder={field.placeholder}
                                    className="w-full rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] px-4 py-2.5 text-sm text-[#0D1B4B] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none"
                                />
                            )}
                        </div>
                    ))}
                </div>
            ))}

            <button
                type="button"
                onClick={add}
                className="inline-flex items-center gap-2 rounded-xl border border-dashed border-[#D1D5E8] px-4 py-2 text-xs font-semibold text-[#213C93] transition-colors hover:border-[#213C93]/40 hover:bg-[#E8EAF6]"
            >
                <Plus size={14} />
                {addLabel}
            </button>
        </div>
    );
}
