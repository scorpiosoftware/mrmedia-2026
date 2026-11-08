import EmailComposer from '@/components/admin/email/EmailComposer';
import {
    formatDateTime,
    post,
    ThreadEmail,
} from '@/components/admin/email/EmailParts';
import { getCsrf } from '@/components/admin/form-controls';
import {
    AlertTriangle,
    Check,
    ChevronDown,
    CornerUpLeft,
    Inbox,
    Loader2,
    Mail,
    MailOpen,
    Paperclip,
    RefreshCw,
    Terminal,
    Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const FILTERS = [
    { key: 'all', label: 'All', count: 'received' },
    { key: 'unread', label: 'Unread', count: 'received_unread' },
];
const REFRESH_MS = 60_000;

function timeAgo(iso) {
    if (!iso) return 'never';
    const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    return hours < 24 ? `${hours} h ago` : formatDateTime(iso);
}

function replySubject(subject) {
    return /^re:/i.test(subject) ? subject : `Re: ${subject}`;
}

function snippet(text) {
    return (text ?? '').replace(/\s+/g, ' ').trim().slice(0, 140);
}

/** Shown until `php artisan mail:imap-setup` has been run on the server. */
function SetupCard() {
    return (
        <div className="rounded-2xl border border-[#C9D8F5] bg-[#F1F6FF] p-6 text-sm text-[#0D1B4B]">
            <h3 className="mb-1 flex items-center gap-2 font-bold">
                <Terminal size={16} /> Receiving email isn’t set up yet
            </h3>
            <p className="mb-3 text-[#5A6A9A]">
                Run this once on the server to connect the mailbox (sending
                settings are not changed):
            </p>
            <pre className="overflow-x-auto rounded-lg bg-[#0D1B4B] px-4 py-3 text-xs text-white">
                php artisan mail:imap-setup
            </pre>
            <p className="mt-3 text-xs text-[#5A6A9A]">
                New emails then arrive here automatically every minute (the
                server’s scheduler must be running).
            </p>
        </div>
    );
}

/**
 * The Mail tab: emails received in the mailbox, newest first. Opening one shows the whole
 * conversation (their emails and our replies) with a reply box.
 */
export default function MailTab({ onCountsChange }) {
    const [emails, setEmails] = useState([]);
    const [counts, setCounts] = useState({});
    const [mailbox, setMailbox] = useState(null);
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [syncing, setSyncing] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [threads, setThreads] = useState({}); // email id → conversation emails
    const [replyingId, setReplyingId] = useState(null);

    const applyCounts = useCallback(
        (c) => {
            if (!c) return;
            setCounts(c);
            onCountsChange?.(c);
        },
        [onCountsChange],
    );

    const load = useCallback(
        async (quiet = false) => {
            if (!quiet) setLoading(true);
            try {
                const res = await fetch(
                    `/spa/admin/mail?filter=${filter}&page=${page}`,
                    {
                        credentials: 'include',
                        headers: { Accept: 'application/json' },
                    },
                );
                if (!res.ok) throw new Error();
                const json = await res.json();
                setEmails(json.emails.data ?? []);
                setLastPage(json.emails.last_page ?? 1);
                setMailbox(json.mailbox);
                applyCounts(json.counts);
                setError('');
            } catch {
                if (!quiet) setError('Failed to load received emails.');
            } finally {
                setLoading(false);
            }
        },
        [filter, page, applyCounts],
    );

    useEffect(() => {
        load();
        const timer = setInterval(
            () => document.visibilityState === 'visible' && load(true),
            REFRESH_MS,
        );
        return () => clearInterval(timer);
    }, [load]);

    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(''), 4000);
        return () => clearTimeout(t);
    }, [notice]);

    const checkNow = async () => {
        setSyncing(true);
        const { ok, json } = await post('/spa/admin/mail/sync');
        setSyncing(false);
        if (json.mailbox) setMailbox(json.mailbox);
        if (!ok) {
            setError(json.message ?? 'Could not check the mailbox.');
            return;
        }
        setError('');
        setNotice(
            json.stored
                ? `${json.stored} new email${json.stored === 1 ? '' : 's'}.`
                : 'No new email.',
        );
        applyCounts(json.counts);
        load(true);
    };

    const openThread = async (email) => {
        const opening = expandedId !== email.id;
        setExpandedId(opening ? email.id : null);
        setReplyingId(null);
        if (!opening) return;

        const res = await fetch(`/spa/admin/emails/${email.id}/thread`, {
            credentials: 'include',
            headers: { Accept: 'application/json' },
        });
        if (!res.ok) {
            setError('Failed to open the email.');
            return;
        }
        const json = await res.json();
        setThreads((prev) => ({ ...prev, [email.id]: json.emails }));
        applyCounts(json.counts);
        // Everything in the conversation is read now.
        const ids = new Set(json.emails.map((e) => e.id));
        setEmails((prev) =>
            prev.map((e) => (ids.has(e.id) ? { ...e, is_read: true } : e)),
        );
    };

    const setRead = async (email, isRead) => {
        const res = await fetch(`/spa/admin/emails/${email.id}/read`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': getCsrf(),
            },
            body: JSON.stringify({ is_read: isRead }),
        });
        if (!res.ok) return;
        const json = await res.json();
        applyCounts(json.counts);
        setEmails((prev) =>
            prev.map((e) =>
                e.id === email.id ? { ...e, is_read: isRead } : e,
            ),
        );
        if (!isRead) setExpandedId(null);
    };

    const remove = async (email) => {
        if (
            !confirm(
                'Delete this email from the dashboard? It stays in your mailbox (webmail).',
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
        applyCounts(json.counts);
        setEmails((prev) => prev.filter((e) => e.id !== email.id));
        setExpandedId(null);
    };

    /** Adds a sent (or failed) reply to the open conversation, replacing an earlier failed attempt. */
    const addToThread = (threadKey, email, replacedId) => {
        setThreads((prev) => ({
            ...prev,
            [threadKey]: [
                ...(prev[threadKey] ?? []).filter(
                    (e) => e.id !== email.id && e.id !== replacedId,
                ),
                email,
            ],
        }));
    };

    if (mailbox && !mailbox.enabled) {
        return <SetupCard />;
    }

    return (
        <>
            {mailbox && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E3E6F0] bg-white px-4 py-2.5 text-xs text-[#5A6A9A]">
                    <span className="flex min-w-0 items-center gap-2">
                        <span
                            className={`h-2 w-2 shrink-0 rounded-full ${mailbox.error ? 'bg-[#d03b3b]' : 'bg-[#0ca30c]'}`}
                            aria-hidden="true"
                        />
                        <span className="truncate">
                            {mailbox.error ? 'Connection problem' : 'Connected'}{' '}
                            ·{' '}
                            <b className="font-semibold text-[#0D1B4B]">
                                {mailbox.username}
                            </b>{' '}
                            · checked {timeAgo(mailbox.synced_at)}
                        </span>
                    </span>
                    <button
                        type="button"
                        onClick={checkNow}
                        disabled={syncing}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#E3E6F0] px-2.5 py-1 font-semibold text-[#213C93] transition hover:bg-[#F5F6FA] disabled:opacity-60"
                    >
                        <RefreshCw
                            size={12}
                            className={syncing ? 'animate-spin' : ''}
                        />{' '}
                        {syncing ? 'Checking…' : 'Check now'}
                    </button>
                </div>
            )}

            {mailbox?.error && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <span className="break-words">
                        The last mailbox check failed: {mailbox.error}. If the
                        password changed, run{' '}
                        <code className="rounded bg-white/70 px-1">
                            php artisan mail:imap-setup
                        </code>{' '}
                        again.
                    </span>
                </div>
            )}
            {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            )}
            {notice && (
                <div
                    role="status"
                    className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
                >
                    <Check size={16} /> {notice}
                </div>
            )}

            <div className="mb-6 flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                    <button
                        key={f.key}
                        onClick={() => {
                            setFilter(f.key);
                            setPage(1);
                        }}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                            filter === f.key
                                ? 'bg-[#213C93] text-white'
                                : 'border border-[#D1D5E8] bg-white text-[#5A6A9A] hover:border-[#213C93]/50 hover:text-[#213C93]'
                        }`}
                    >
                        {f.label}
                        <span
                            className={`rounded-full px-2 py-0.5 text-xs ${filter === f.key ? 'bg-white/20' : 'bg-[#F1F1F0] text-[#5A6A9A]'}`}
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
                    <Inbox size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium">
                        {filter === 'unread'
                            ? 'No unread email'
                            : 'No email received yet'}
                    </p>
                    <p className="text-sm">
                        Emails sent to {mailbox?.username ?? 'your mailbox'}{' '}
                        appear here.
                    </p>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {emails.map((email) => {
                            const expanded = expandedId === email.id;
                            const thread = threads[email.id];
                            const latestInbound = thread
                                ? ([...thread]
                                      .reverse()
                                      .find((e) => e.direction === 'inbound') ??
                                  email)
                                : email;
                            return (
                                <div
                                    key={email.id}
                                    className={`overflow-hidden rounded-2xl border bg-white transition-colors ${
                                        email.is_read
                                            ? 'border-[#D1D5E8]'
                                            : 'border-[#213C93]/40 shadow-[0_2px_12px_rgba(33,60,147,0.08)]'
                                    }`}
                                >
                                    <button
                                        onClick={() => openThread(email)}
                                        className="flex w-full items-center gap-4 p-5 text-left"
                                        aria-expanded={expanded}
                                    >
                                        <div
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${email.is_read ? 'bg-[#F1F1F0] text-[#5A6A9A]' : 'bg-[#213C93] text-white'}`}
                                        >
                                            {email.is_read ? (
                                                <MailOpen size={18} />
                                            ) : (
                                                <Mail size={18} />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-0.5 flex flex-wrap items-center gap-2">
                                                <h3
                                                    className={`truncate text-[#0D1B4B] ${email.is_read ? 'font-semibold' : 'font-bold'}`}
                                                >
                                                    {email.from_name ||
                                                        email.from_address}
                                                </h3>
                                                {email.thread_size > 1 && (
                                                    <span className="rounded-full bg-[#F1F1F0] px-2 py-0.5 text-xs font-semibold text-[#5A6A9A]">
                                                        {email.thread_size}
                                                    </span>
                                                )}
                                                {email.contact_message_id && (
                                                    <span
                                                        className="rounded-full bg-[#E8EAF6] px-2.5 py-0.5 text-xs font-semibold text-[#213C93]"
                                                        title="Answer to a reply you sent to a contact form message"
                                                    >
                                                        Contact form
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
                                            <p
                                                className={`truncate text-sm ${email.is_read ? 'text-[#0D1B4B]' : 'font-semibold text-[#0D1B4B]'}`}
                                            >
                                                {email.subject}
                                            </p>
                                            <p className="truncate text-xs text-[#5A6A9A]">
                                                {formatDateTime(email.sent_at)}{' '}
                                                · {snippet(email.body)}
                                            </p>
                                        </div>
                                        <ChevronDown
                                            size={16}
                                            className={`shrink-0 text-[#5A6A9A] transition-transform ${expanded ? 'rotate-180' : ''}`}
                                        />
                                    </button>

                                    {expanded && (
                                        <div className="border-t border-[#E8EAF6] px-5 py-4">
                                            {!thread ? (
                                                <Loader2
                                                    size={20}
                                                    className="mx-auto my-4 animate-spin text-[#213C93]"
                                                />
                                            ) : (
                                                <ol className="mb-4 space-y-3">
                                                    {thread.map((e) => (
                                                        <ThreadEmail
                                                            key={e.id}
                                                            email={e}
                                                            onEmailChange={(
                                                                updated,
                                                            ) =>
                                                                addToThread(
                                                                    email.id,
                                                                    updated,
                                                                )
                                                            }
                                                        />
                                                    ))}
                                                </ol>
                                            )}

                                            {replyingId === email.id && (
                                                <div className="mb-4 rounded-xl border border-[#213C93]/30 bg-white p-4 shadow-[0_2px_12px_rgba(33,60,147,0.06)]">
                                                    <EmailComposer
                                                        mode="reply"
                                                        replyTo={
                                                            latestInbound.reply_to_address ||
                                                            latestInbound.from_address
                                                        }
                                                        replyToEmailId={
                                                            latestInbound.id
                                                        }
                                                        defaultSubject={replySubject(
                                                            latestInbound.subject,
                                                        )}
                                                        onSent={(
                                                            sent,
                                                            newCounts,
                                                            replacedId,
                                                        ) => {
                                                            addToThread(
                                                                email.id,
                                                                sent,
                                                                replacedId,
                                                            );
                                                            applyCounts(
                                                                newCounts,
                                                            );
                                                            setReplyingId(null);
                                                            setNotice(
                                                                `Reply sent to ${sent.to.join(', ')}.`,
                                                            );
                                                        }}
                                                        onFailed={(
                                                            failed,
                                                            newCounts,
                                                            replacedId,
                                                        ) => {
                                                            addToThread(
                                                                email.id,
                                                                failed,
                                                                replacedId,
                                                            );
                                                            applyCounts(
                                                                newCounts,
                                                            );
                                                        }}
                                                        onCancel={() =>
                                                            setReplyingId(null)
                                                        }
                                                    />
                                                </div>
                                            )}

                                            <div className="flex flex-wrap gap-2">
                                                {replyingId !== email.id && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setReplyingId(
                                                                email.id,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-2 rounded-xl bg-[#213C93] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#2E52C9]"
                                                    >
                                                        <CornerUpLeft
                                                            size={13}
                                                        />{' '}
                                                        Reply
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setRead(email, false)
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-xl bg-[#E8EAF6] px-4 py-2 text-xs font-semibold text-[#213C93] transition-colors hover:bg-[#D1D5E8]"
                                                >
                                                    <Mail size={13} /> Mark as
                                                    unread
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        remove(email)
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-[#5A6A9A] transition-colors hover:bg-red-50 hover:text-red-600"
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
