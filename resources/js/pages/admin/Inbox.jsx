import AdminLayout from '@/components/admin/AdminLayout';
import EmailComposer from '@/components/admin/email/EmailComposer';
import MailTab from '@/components/admin/email/MailTab';
import {
    ComposeDialog,
    EmailThread,
    SentEmails,
} from '@/components/admin/email/EmailParts';
import {
    AlertTriangle,
    CornerUpLeft,
    PenSquare,
    Send,
    Check,
    Inbox as InboxIcon,
    Loader2,
    Mail,
    MailOpen,
    Phone,
    Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

function getCsrf() {
    return (
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ?? ''
    );
}

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'spam', label: 'Blocked' },
];

const TABS = [
    { key: 'messages', label: 'Contact form' },
    { key: 'mail', label: 'Mail' },
    { key: 'sent', label: 'Sent' },
];

/** Subject line a reply starts with, e.g. "Re: Your enquiry about Branding". */
function replySubject(message) {
    const last = [...(message.emails ?? [])]
        .reverse()
        .find((e) => e.status === 'sent');
    if (last)
        return last.subject.startsWith('Re:')
            ? last.subject
            : `Re: ${last.subject}`;
    return message.service
        ? `Re: Your enquiry about ${message.service}`
        : 'Re: Your message';
}

function formatDate(value) {
    if (!value) return '';
    return new Date(value).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

export default function AdminInbox() {
    const [messages, setMessages] = useState([]);
    const [counts, setCounts] = useState({ all: 0, unread: 0, spam: 0 });
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [tab, setTab] = useState('messages');
    const [replyingId, setReplyingId] = useState(null);
    const [composeOpen, setComposeOpen] = useState(false);
    const [sentCounts, setSentCounts] = useState(null);
    const [sentRefresh, setSentRefresh] = useState(0);
    const [notice, setNotice] = useState('');

    useEffect(() => {
        fetch('/spa/admin/emails?page=1', {
            credentials: 'include',
            headers: { Accept: 'application/json' },
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((json) => json && setSentCounts(json.counts))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(''), 4000);
        return () => clearTimeout(t);
    }, [notice]);

    const onSentCounts = useCallback((c) => setSentCounts(c), []);

    /** Puts a sent (or failed) reply into its message's conversation, replacing an earlier failed attempt. */
    const upsertReply = (messageId, email, replacedId, newCounts) => {
        if (newCounts) setSentCounts(newCounts);
        setMessages((prev) =>
            prev.map((m) => {
                if (m.id !== messageId) return m;
                const others = (m.emails ?? []).filter(
                    (e) => e.id !== email.id && e.id !== replacedId,
                );
                return {
                    ...m,
                    emails: [...others, email].sort((a, b) => a.id - b.id),
                    replied_at:
                        email.status === 'sent' ? email.sent_at : m.replied_at,
                    is_read: email.status === 'sent' ? true : m.is_read,
                };
            }),
        );
    };

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        fetch(`/spa/admin/inbox?filter=${filter}&page=${page}`, {
            credentials: 'include',
        })
            .then((r) => (r.ok ? r.json() : null))
            .then((json) => {
                if (cancelled || !json) return;
                setMessages(json.messages.data ?? []);
                setLastPage(json.messages.last_page ?? 1);
                setCounts(json.counts);
                setLoading(false);
            })
            .catch(() => {
                if (!cancelled) {
                    setErrorMsg('Failed to load messages.');
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [filter, page]);

    const applyUpdate = (json, id) => {
        setCounts(json.counts);
        if (json.message) {
            setMessages((prev) =>
                prev.map((m) => (m.id === id ? json.message : m)),
            );
        }
    };

    const toggleRead = async (message, isRead) => {
        try {
            const res = await fetch(`/spa/admin/inbox/${message.id}/read`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                },
                body: JSON.stringify({ is_read: isRead }),
            });
            if (res.ok) applyUpdate(await res.json(), message.id);
        } catch {
            setErrorMsg('Failed to update message.');
        }
    };

    const handleExpand = (message) => {
        const opening = expandedId !== message.id;
        setExpandedId(opening ? message.id : null);
        if (opening && !message.is_read) toggleRead(message, true);
    };

    const handleDelete = async (message) => {
        if (!confirm(`Delete the message from ${message.name}?`)) return;
        try {
            const res = await fetch(`/spa/admin/inbox/${message.id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'X-CSRF-TOKEN': getCsrf(),
                    Accept: 'application/json',
                },
            });
            if (res.ok) {
                const json = await res.json();
                setCounts(json.counts);
                setMessages((prev) => prev.filter((m) => m.id !== message.id));
            }
        } catch {
            setErrorMsg('Failed to delete message.');
        }
    };

    return (
        <AdminLayout
            title="Inbox"
            actions={
                <button
                    type="button"
                    onClick={() => setComposeOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#213C93] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#2E52C9]"
                >
                    <PenSquare size={15} />
                    <span className="hidden sm:inline">New email</span>
                </button>
            }
        >
            <ComposeDialog
                open={composeOpen}
                onOpenChange={setComposeOpen}
                onSent={(email, newCounts) => {
                    if (newCounts) setSentCounts(newCounts);
                    setSentRefresh((n) => n + 1);
                    setNotice(`Email sent to ${email.to.join(', ')}.`);
                }}
                onFailed={(email, newCounts) => {
                    if (newCounts) setSentCounts(newCounts);
                    setSentRefresh((n) => n + 1);
                }}
            />

            {errorMsg && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {errorMsg}
                </div>
            )}
            {notice && (
                <div
                    role="status"
                    className="mb-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
                >
                    <Check size={16} /> {notice}
                </div>
            )}

            <div
                role="tablist"
                aria-label="Inbox sections"
                className="mb-5 flex gap-1 border-b border-[#D1D5E8]"
            >
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        role="tab"
                        aria-selected={tab === t.key}
                        onClick={() => setTab(t.key)}
                        className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                            tab === t.key
                                ? 'border-[#213C93] text-[#213C93]'
                                : 'border-transparent text-[#5A6A9A] hover:text-[#0D1B4B]'
                        }`}
                    >
                        {t.key === 'messages' && <InboxIcon size={15} />}
                        {t.key === 'mail' && <Mail size={15} />}
                        {t.key === 'sent' && <Send size={15} />}
                        {t.label}
                        {t.key === 'mail' &&
                            sentCounts?.received_unread > 0 && (
                                <span className="rounded-full bg-[#213C93] px-1.5 py-0.5 text-[10px] leading-none text-white">
                                    {sentCounts.received_unread}
                                </span>
                            )}
                        {t.key === 'messages' && counts.unread > 0 && (
                            <span className="rounded-full bg-[#213C93] px-1.5 py-0.5 text-[10px] leading-none text-white">
                                {counts.unread}
                            </span>
                        )}
                        {t.key === 'sent' && sentCounts?.failed > 0 && (
                            <span
                                className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] leading-none text-red-700"
                                title="Failed emails"
                            >
                                {sentCounts.failed} failed
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {tab === 'mail' ? (
                <MailTab onCountsChange={onSentCounts} />
            ) : tab === 'sent' ? (
                <SentEmails
                    refreshKey={sentRefresh}
                    onCountsChange={onSentCounts}
                />
            ) : (
                <>
                    <div className="mb-6 flex flex-wrap gap-2">
                        {FILTERS.map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => {
                                    setFilter(key);
                                    setPage(1);
                                }}
                                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                                    filter === key
                                        ? 'bg-[#213C93] text-white'
                                        : 'border border-[#D1D5E8] bg-white text-[#5A6A9A] hover:border-[#213C93]/50 hover:text-[#213C93]'
                                }`}
                            >
                                {label}
                                <span
                                    className={`rounded-full px-2 py-0.5 text-xs ${
                                        filter === key
                                            ? 'bg-white/20'
                                            : 'bg-[#F1F1F0] text-[#5A6A9A]'
                                    }`}
                                >
                                    {counts[key] ?? 0}
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
                    ) : messages.length === 0 ? (
                        <div className="py-24 text-center text-[#5A6A9A]">
                            <InboxIcon
                                size={40}
                                className="mx-auto mb-3 opacity-30"
                            />
                            <p className="font-medium">
                                {filter === 'spam'
                                    ? 'No blocked submissions'
                                    : 'No messages yet'}
                            </p>
                            <p className="text-sm">
                                {filter === 'spam'
                                    ? 'Submissions caught by the bot trap will appear here.'
                                    : 'Enquiries from the contact form will appear here.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {messages.map((message) => {
                                    const expanded = expandedId === message.id;
                                    return (
                                        <div
                                            key={message.id}
                                            className={`overflow-hidden rounded-2xl border bg-white transition-colors ${
                                                message.is_read
                                                    ? 'border-[#D1D5E8]'
                                                    : 'border-[#213C93]/40 shadow-[0_2px_12px_rgba(33,60,147,0.08)]'
                                            }`}
                                        >
                                            <button
                                                onClick={() =>
                                                    handleExpand(message)
                                                }
                                                className="flex w-full items-center gap-4 p-5 text-left"
                                            >
                                                <div
                                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                                        message.is_read
                                                            ? 'bg-[#F1F1F0] text-[#5A6A9A]'
                                                            : 'bg-[#213C93] text-white'
                                                    }`}
                                                >
                                                    {message.is_read ? (
                                                        <MailOpen size={18} />
                                                    ) : (
                                                        <Mail size={18} />
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="mb-1 flex flex-wrap items-center gap-2">
                                                        <h3
                                                            className={`truncate ${message.is_read ? 'font-semibold' : 'font-bold'} text-[#0D1B4B]`}
                                                        >
                                                            {message.name}
                                                        </h3>
                                                        {message.service && (
                                                            <span className="rounded-full bg-[#E8EAF6] px-2.5 py-0.5 text-xs font-semibold text-[#213C93]">
                                                                {
                                                                    message.service
                                                                }
                                                            </span>
                                                        )}
                                                        {message.replied_at && (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF6EA] px-2.5 py-0.5 text-xs font-semibold text-[#006300]">
                                                                <CornerUpLeft
                                                                    size={11}
                                                                />
                                                                Replied
                                                            </span>
                                                        )}
                                                        {!message.mail_delivered &&
                                                            !message.is_spam && (
                                                                <span
                                                                    title={
                                                                        message.mail_error ??
                                                                        'The notification email did not go out.'
                                                                    }
                                                                    className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700"
                                                                >
                                                                    <AlertTriangle
                                                                        size={
                                                                            11
                                                                        }
                                                                    />
                                                                    Email failed
                                                                </span>
                                                            )}
                                                    </div>
                                                    <p className="truncate text-xs text-[#5A6A9A]">
                                                        {[
                                                            message.phone,
                                                            message.email,
                                                            formatDate(
                                                                message.created_at,
                                                            ),
                                                        ]
                                                            .filter(Boolean)
                                                            .join(' · ')}
                                                    </p>
                                                </div>
                                            </button>

                                            {expanded && (
                                                <div className="border-t border-[#E8EAF6] px-5 py-4">
                                                    {message.message && (
                                                        <p className="mb-4 text-sm whitespace-pre-wrap text-[#0D1B4B]">
                                                            {message.message}
                                                        </p>
                                                    )}

                                                    <dl className="mb-4 grid gap-x-6 gap-y-1 text-xs text-[#5A6A9A] sm:grid-cols-2">
                                                        <div>
                                                            <dt className="inline font-semibold">
                                                                IP:{' '}
                                                            </dt>
                                                            <dd className="inline">
                                                                {message.ip_address ??
                                                                    '—'}
                                                            </dd>
                                                        </div>
                                                        <div className="truncate">
                                                            <dt className="inline font-semibold">
                                                                Browser:{' '}
                                                            </dt>
                                                            <dd className="inline">
                                                                {message.user_agent ??
                                                                    '—'}
                                                            </dd>
                                                        </div>
                                                        {message.mail_error && (
                                                            <div className="sm:col-span-2">
                                                                <dt className="inline font-semibold text-amber-700">
                                                                    Mail
                                                                    error:{' '}
                                                                </dt>
                                                                <dd className="inline text-amber-700">
                                                                    {
                                                                        message.mail_error
                                                                    }
                                                                </dd>
                                                            </div>
                                                        )}
                                                    </dl>

                                                    <EmailThread
                                                        emails={message.emails}
                                                        onEmailChange={(
                                                            email,
                                                            newCounts,
                                                        ) =>
                                                            upsertReply(
                                                                message.id,
                                                                email,
                                                                null,
                                                                newCounts,
                                                            )
                                                        }
                                                    />

                                                    {replyingId ===
                                                        message.id &&
                                                        message.email && (
                                                            <div className="mb-4 rounded-xl border border-[#213C93]/30 bg-white p-4 shadow-[0_2px_12px_rgba(33,60,147,0.06)]">
                                                                <EmailComposer
                                                                    mode="reply"
                                                                    replyTo={
                                                                        message.email
                                                                    }
                                                                    contactMessageId={
                                                                        message.id
                                                                    }
                                                                    defaultSubject={replySubject(
                                                                        message,
                                                                    )}
                                                                    onSent={(
                                                                        email,
                                                                        newCounts,
                                                                        replacedId,
                                                                    ) => {
                                                                        upsertReply(
                                                                            message.id,
                                                                            email,
                                                                            replacedId,
                                                                            newCounts,
                                                                        );
                                                                        setReplyingId(
                                                                            null,
                                                                        );
                                                                        setNotice(
                                                                            `Reply sent to ${message.email}.`,
                                                                        );
                                                                    }}
                                                                    onFailed={(
                                                                        email,
                                                                        newCounts,
                                                                        replacedId,
                                                                    ) =>
                                                                        upsertReply(
                                                                            message.id,
                                                                            email,
                                                                            replacedId,
                                                                            newCounts,
                                                                        )
                                                                    }
                                                                    onCancel={() =>
                                                                        setReplyingId(
                                                                            null,
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        )}

                                                    <div className="flex flex-wrap gap-2">
                                                        {message.phone && (
                                                            <a
                                                                href={`tel:${message.phone.replace(/[^\d+]/g, '')}`}
                                                                className="inline-flex items-center gap-2 rounded-xl bg-[#213C93] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#2E52C9]"
                                                            >
                                                                <Phone
                                                                    size={13}
                                                                />
                                                                Call
                                                            </a>
                                                        )}
                                                        {message.email &&
                                                            replyingId !==
                                                                message.id && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setReplyingId(
                                                                            message.id,
                                                                        )
                                                                    }
                                                                    className="inline-flex items-center gap-2 rounded-xl bg-[#213C93] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#2E52C9]"
                                                                >
                                                                    <CornerUpLeft
                                                                        size={
                                                                            13
                                                                        }
                                                                    />
                                                                    {message
                                                                        .emails
                                                                        ?.length
                                                                        ? 'Reply again'
                                                                        : 'Reply by email'}
                                                                </button>
                                                            )}
                                                        <button
                                                            onClick={() =>
                                                                toggleRead(
                                                                    message,
                                                                    !message.is_read,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-2 rounded-xl bg-[#E8EAF6] px-4 py-2 text-xs font-semibold text-[#213C93] transition-colors hover:bg-[#D1D5E8]"
                                                        >
                                                            <Check size={13} />
                                                            Mark as{' '}
                                                            {message.is_read
                                                                ? 'unread'
                                                                : 'read'}
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(
                                                                    message,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold text-[#5A6A9A] transition-colors hover:bg-red-50 hover:text-red-600"
                                                        >
                                                            <Trash2 size={13} />
                                                            Delete
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
            )}
        </AdminLayout>
    );
}
