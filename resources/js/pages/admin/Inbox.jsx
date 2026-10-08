import AdminLayout from '@/components/admin/AdminLayout';
import {
    AlertTriangle,
    Check,
    Inbox as InboxIcon,
    Loader2,
    Mail,
    MailOpen,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

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
        <AdminLayout title="Inbox">
            {errorMsg && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {errorMsg}
                </div>
            )}

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
                    <Loader2 size={28} className="animate-spin text-[#213C93]" />
                </div>
            ) : messages.length === 0 ? (
                <div className="py-24 text-center text-[#5A6A9A]">
                    <InboxIcon size={40} className="mx-auto mb-3 opacity-30" />
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
                                        onClick={() => handleExpand(message)}
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
                                                <span className="rounded-full bg-[#E8EAF6] px-2.5 py-0.5 text-xs font-semibold text-[#213C93]">
                                                    {message.service}
                                                </span>
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
                                                                size={11}
                                                            />
                                                            Email failed
                                                        </span>
                                                    )}
                                            </div>
                                            <p className="truncate text-xs text-[#5A6A9A]">
                                                {message.email} ·{' '}
                                                {formatDate(message.created_at)}
                                            </p>
                                        </div>
                                    </button>

                                    {expanded && (
                                        <div className="border-t border-[#E8EAF6] px-5 py-4">
                                            <p className="mb-4 text-sm whitespace-pre-wrap text-[#0D1B4B]">
                                                {message.message}
                                            </p>

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
                                                            Mail error:{' '}
                                                        </dt>
                                                        <dd className="inline text-amber-700">
                                                            {message.mail_error}
                                                        </dd>
                                                    </div>
                                                )}
                                            </dl>

                                            <div className="flex flex-wrap gap-2">
                                                <a
                                                    href={`mailto:${message.email}`}
                                                    className="inline-flex items-center gap-2 rounded-xl bg-[#213C93] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#2E52C9]"
                                                >
                                                    <Mail size={13} />
                                                    Reply
                                                </a>
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
                                                        handleDelete(message)
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
        </AdminLayout>
    );
}
