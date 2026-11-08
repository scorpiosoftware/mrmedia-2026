import EmailComposer, {
    formatBytes,
} from '@/components/admin/email/EmailComposer';
import { getCsrf } from '@/components/admin/form-controls';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    Loader2,
    MailX,
    Paperclip,
    RotateCw,
    Send,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

export function formatDateTime(value) {
    if (!value) return '';
    return new Date(value).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

async function post(url, method = 'POST') {
    const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { Accept: 'application/json', 'X-CSRF-TOKEN': getCsrf() },
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, json };
}

/** "Sent" / "Failed" badge — icon + label, never colour alone. */
export function EmailStatus({ email }) {
    return email.status === 'sent' ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF6EA] px-2 py-0.5 text-xs font-semibold text-[#006300]">
            <CheckCircle2 size={11} /> Sent
        </span>
    ) : (
        <span
            title={email.error ?? ''}
            className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700"
        >
            <AlertTriangle size={11} /> Failed
        </span>
    );
}

function Attachments({ email }) {
    if (!email.attachment_list?.length) return null;
    return (
        <ul className="mt-3 flex flex-wrap gap-2">
            {email.attachment_list.map((a) => (
                <li key={a.index}>
                    <a
                        href={`/spa/admin/emails/${email.id}/attachments/${a.index}`}
                        className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-[#D1D5E8] bg-white px-2.5 py-1 text-xs text-[#0D1B4B] hover:border-[#213C93]/50 hover:text-[#213C93]"
                    >
                        <Paperclip size={12} className="shrink-0" />
                        <span className="truncate">{a.name}</span>
                        <span className="shrink-0 text-[#9AA3BF]">
                            {formatBytes(a.size)}
                        </span>
                    </a>
                </li>
            ))}
        </ul>
    );
}

/** Retry button for a failed email; calls `onChange(email, counts)` with the result. */
function RetryButton({ email, onChange }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const retry = async () => {
        setBusy(true);
        setError('');
        const { ok, json } = await post(`/spa/admin/emails/${email.id}/resend`);
        setBusy(false);
        if (json.email) onChange?.(json.email, json.counts);
        if (!ok) setError(json.message ?? 'Still failing.');
    };
    return (
        <span className="inline-flex flex-wrap items-center gap-2">
            <button
                type="button"
                onClick={retry}
                disabled={busy}
                className="inline-flex items-center gap-1 rounded-lg bg-[#E8EAF6] px-2.5 py-1 text-xs font-semibold text-[#213C93] hover:bg-[#D1D5E8] disabled:opacity-60"
            >
                {busy ? (
                    <Loader2 size={12} className="animate-spin" />
                ) : (
                    <RotateCw size={12} />
                )}{' '}
                Try again
            </button>
            {error && <span className="text-xs text-red-700">{error}</span>}
        </span>
    );
}

/** The replies sent to a contact message, shown under it as a conversation. */
export function EmailThread({ emails, onEmailChange }) {
    if (!emails?.length) return null;
    return (
        <ol className="mb-4 space-y-3">
            {emails.map((email) => (
                <li
                    key={email.id}
                    className="rounded-xl border border-[#E3E6F0] bg-[#F7F8FB] p-4"
                >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-[#5A6A9A]">
                            <Send size={11} className="mr-1 inline" />
                            <span className="font-semibold text-[#0D1B4B]">
                                {email.sent_by ?? email.from_name ?? 'You'}
                            </span>{' '}
                            replied ·{' '}
                            {formatDateTime(email.sent_at ?? email.created_at)}
                        </p>
                        <EmailStatus email={email} />
                    </div>
                    <p className="mb-1 text-sm font-semibold text-[#0D1B4B]">
                        {email.subject}
                    </p>
                    <p
                        className="text-sm whitespace-pre-wrap text-[#0D1B4B]"
                        dir="auto"
                    >
                        {email.body}
                    </p>
                    <Attachments email={email} />
                    {email.status === 'failed' && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-red-700">
                            <span className="break-words">{email.error}</span>
                            <RetryButton
                                email={email}
                                onChange={onEmailChange}
                            />
                        </div>
                    )}
                </li>
            ))}
        </ol>
    );
}

/** Modal for writing a new email. */
export function ComposeDialog({
    open,
    onOpenChange,
    onSent,
    onFailed,
    initialTo = '',
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] overflow-y-auto bg-white sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-[#0D1B4B]">
                        New email
                    </DialogTitle>
                    <DialogDescription className="text-[#5A6A9A]">
                        Sent from the address in Email Settings. Separate
                        several addresses with commas.
                    </DialogDescription>
                </DialogHeader>
                {open && (
                    <EmailComposer
                        mode="new"
                        initialTo={initialTo}
                        onSent={(email, counts) => {
                            onSent?.(email, counts);
                            onOpenChange(false);
                        }}
                        onFailed={onFailed}
                        onCancel={() => onOpenChange(false)}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

const SENT_FILTERS = [
    { key: 'all', label: 'All sent', count: 'sent' },
    { key: 'failed', label: 'Failed', count: 'failed' },
];

/** The Sent tab: every email sent from the dashboard, with status, retry and delete. */
export function SentEmails({ refreshKey, onCountsChange }) {
    const [emails, setEmails] = useState([]);
    const [counts, setCounts] = useState({ sent: 0, failed: 0 });
    const [status, setStatus] = useState('all');
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetch(`/spa/admin/emails?status=${status}&page=${page}`, {
            credentials: 'include',
            headers: { Accept: 'application/json' },
        })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((json) => {
                if (cancelled) return;
                setEmails(json.emails.data ?? []);
                setLastPage(json.emails.last_page ?? 1);
                setCounts(json.counts);
                onCountsChange?.(json.counts);
                setLoading(false);
            })
            .catch(() => {
                if (!cancelled) {
                    setError('Failed to load sent emails.');
                    setLoading(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [status, page, refreshKey, onCountsChange]);

    const replace = (email, newCounts) => {
        setEmails((prev) =>
            prev.map((e) => (e.id === email.id ? { ...e, ...email } : e)),
        );
        if (newCounts) {
            setCounts(newCounts);
            onCountsChange?.(newCounts);
        }
    };

    const remove = async (email) => {
        if (
            !confirm(
                'Delete this email from the Sent list? It stays in the recipient’s mailbox.',
            )
        )
            return;
        const { ok, json } = await post(
            `/spa/admin/emails/${email.id}`,
            'DELETE',
        );
        if (!ok) {
            setError('Failed to delete the email.');
            return;
        }
        setEmails((prev) => prev.filter((e) => e.id !== email.id));
        setCounts(json.counts);
        onCountsChange?.(json.counts);
    };

    return (
        <>
            {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}
            <div className="mb-6 flex flex-wrap gap-2">
                {SENT_FILTERS.map((f) => (
                    <button
                        key={f.key}
                        onClick={() => {
                            setStatus(f.key);
                            setPage(1);
                        }}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                            status === f.key
                                ? 'bg-[#213C93] text-white'
                                : 'border border-[#D1D5E8] bg-white text-[#5A6A9A] hover:border-[#213C93]/50 hover:text-[#213C93]'
                        }`}
                    >
                        {f.label}
                        <span
                            className={`rounded-full px-2 py-0.5 text-xs ${status === f.key ? 'bg-white/20' : 'bg-[#F1F1F0] text-[#5A6A9A]'}`}
                        >
                            {counts[f.count] ?? 0}
                        </span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-24">
                    <Loader2
                        size={28}
                        className="animate-spin text-[#213C93]"
                    />
                </div>
            ) : emails.length === 0 ? (
                <div className="py-24 text-center text-[#5A6A9A]">
                    <MailX size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">
                        {status === 'failed'
                            ? 'No failed emails'
                            : 'No emails sent yet'}
                    </p>
                    <p className="text-sm">
                        Replies and new emails you send from the dashboard
                        appear here.
                    </p>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {emails.map((email) => {
                            const expanded = expandedId === email.id;
                            const recipients = [
                                ...(email.to ?? []),
                                ...(email.cc ?? []),
                            ];
                            return (
                                <div
                                    key={email.id}
                                    className="overflow-hidden rounded-2xl border border-[#D1D5E8] bg-white"
                                >
                                    <button
                                        onClick={() =>
                                            setExpandedId(
                                                expanded ? null : email.id,
                                            )
                                        }
                                        className="flex w-full items-center gap-4 p-5 text-left"
                                        aria-expanded={expanded}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex flex-wrap items-center gap-2">
                                                <h3 className="truncate font-semibold text-[#0D1B4B]">
                                                    {email.subject}
                                                </h3>
                                                <EmailStatus email={email} />
                                                {email.contact_message_id && (
                                                    <span className="rounded-full bg-[#E8EAF6] px-2.5 py-0.5 text-xs font-semibold text-[#213C93]">
                                                        Reply
                                                    </span>
                                                )}
                                                {email.attachment_list?.length >
                                                    0 && (
                                                    <Paperclip
                                                        size={13}
                                                        className="text-[#5A6A9A]"
                                                        aria-label="Has attachments"
                                                    />
                                                )}
                                            </div>
                                            <p className="truncate text-xs text-[#5A6A9A]">
                                                To {recipients.join(', ')} ·{' '}
                                                {formatDateTime(
                                                    email.sent_at ??
                                                        email.created_at,
                                                )}
                                                {email.sent_by &&
                                                    ` · by ${email.sent_by}`}
                                            </p>
                                        </div>
                                        <ChevronDown
                                            size={16}
                                            className={`shrink-0 text-[#5A6A9A] transition-transform ${expanded ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                    {expanded && (
                                        <div className="border-t border-[#E8EAF6] px-5 py-4">
                                            <dl className="mb-3 grid gap-1 text-xs text-[#5A6A9A]">
                                                <div>
                                                    <dt className="inline font-semibold">
                                                        From:{' '}
                                                    </dt>
                                                    <dd className="inline">
                                                        {email.from_name} &lt;
                                                        {email.from_address}&gt;
                                                    </dd>
                                                </div>
                                                <div>
                                                    <dt className="inline font-semibold">
                                                        To:{' '}
                                                    </dt>
                                                    <dd className="inline">
                                                        {email.to?.join(', ')}
                                                    </dd>
                                                </div>
                                                {email.cc?.length > 0 && (
                                                    <div>
                                                        <dt className="inline font-semibold">
                                                            CC:{' '}
                                                        </dt>
                                                        <dd className="inline">
                                                            {email.cc.join(
                                                                ', ',
                                                            )}
                                                        </dd>
                                                    </div>
                                                )}
                                                {email.bcc?.length > 0 && (
                                                    <div>
                                                        <dt className="inline font-semibold">
                                                            BCC:{' '}
                                                        </dt>
                                                        <dd className="inline">
                                                            {email.bcc.join(
                                                                ', ',
                                                            )}
                                                        </dd>
                                                    </div>
                                                )}
                                            </dl>
                                            <p
                                                className="text-sm whitespace-pre-wrap text-[#0D1B4B]"
                                                dir="auto"
                                            >
                                                {email.body}
                                            </p>
                                            <Attachments email={email} />
                                            {email.status === 'failed' && (
                                                <p className="mt-3 text-xs break-words text-red-700">
                                                    {email.error}
                                                </p>
                                            )}
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {email.status === 'failed' && (
                                                    <RetryButton
                                                        email={email}
                                                        onChange={replace}
                                                    />
                                                )}
                                                <button
                                                    onClick={() =>
                                                        remove(email)
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#5A6A9A] transition-colors hover:bg-red-50 hover:text-red-600"
                                                >
                                                    <Trash2 size={13} /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {lastPage > 1 && (
                        <div className="mt-6 flex items-center justify-center gap-3">
                            <button
                                onClick={() => setPage((p) => p - 1)}
                                disabled={page <= 1}
                                className="rounded-xl border border-[#D1D5E8] bg-white px-4 py-2 text-sm font-semibold text-[#213C93] disabled:opacity-40"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-[#5A6A9A]">
                                Page {page} of {lastPage}
                            </span>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= lastPage}
                                className="rounded-xl border border-[#D1D5E8] bg-white px-4 py-2 text-sm font-semibold text-[#213C93] disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </>
    );
}
