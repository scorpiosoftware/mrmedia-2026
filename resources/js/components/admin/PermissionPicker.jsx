import { Check, Lock } from 'lucide-react';

/**
 * Permission checkboxes grouped by dashboard section (groups come from config/permissions.php
 * via the API). `inherited` permissions are shown ticked and locked — e.g. granted by a role.
 * `grantable` (optional) limits which permissions can be newly ticked.
 */
export default function PermissionPicker({
    groups,
    value,
    onChange,
    inherited = [],
    inheritedLabel = 'via role',
    grantable = null,
}) {
    const toggle = (name) =>
        onChange(
            value.includes(name)
                ? value.filter((p) => p !== name)
                : [...value, name],
        );

    return (
        <div className="grid gap-3 sm:grid-cols-2">
            {Object.entries(groups).map(([key, group]) => (
                <div
                    key={key}
                    className="rounded-xl border border-[#D1D5E8] bg-[#F1F1F0] p-3"
                >
                    <p className="mb-2 text-xs font-bold tracking-wider text-[#213C93] uppercase">
                        {group.label}
                    </p>
                    <div className="space-y-1.5">
                        {Object.entries(group.permissions).map(
                            ([name, description]) => {
                                const viaInherited = inherited.includes(name);
                                const checked =
                                    viaInherited || value.includes(name);
                                const blocked =
                                    !viaInherited &&
                                    !value.includes(name) &&
                                    grantable !== null &&
                                    !grantable.includes(name);
                                const disabled = viaInherited || blocked;
                                return (
                                    <button
                                        key={name}
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => toggle(name)}
                                        title={
                                            blocked
                                                ? "You can't grant a permission you don't have"
                                                : name
                                        }
                                        className={`flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors ${
                                            disabled
                                                ? 'cursor-not-allowed'
                                                : 'hover:bg-white'
                                        } ${blocked ? 'opacity-50' : ''}`}
                                    >
                                        <span
                                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                                checked
                                                    ? viaInherited
                                                        ? 'border-[#5A6A9A] bg-[#5A6A9A] text-white'
                                                        : 'border-[#213C93] bg-[#213C93] text-white'
                                                    : 'border-[#B8C0DC] bg-white'
                                            }`}
                                        >
                                            {checked && (
                                                <Check
                                                    size={11}
                                                    strokeWidth={3}
                                                />
                                            )}
                                        </span>
                                        <span className="min-w-0 flex-1 text-[#0D1B4B]">
                                            {description}
                                            {viaInherited && (
                                                <span className="ml-1.5 inline-flex items-center gap-1 text-xs text-[#5A6A9A]">
                                                    <Lock size={10} />{' '}
                                                    {inheritedLabel}
                                                </span>
                                            )}
                                        </span>
                                    </button>
                                );
                            },
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
