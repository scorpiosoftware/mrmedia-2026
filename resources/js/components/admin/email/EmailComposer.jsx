import { getCsrf } from '@/components/admin/form-controls';
import { AlertCircle, Loader2, Paperclip, Send, X } from 'lucide-react';
import { useRef, useState } from 'react';

const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPT =
    '.pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip';

const FIELD =
    'w-full rounded-xl border border-[#D1D5E8] bg-white px-3.5 py-2.5 text-sm text-[#0D1B4B] placeholder:text-[#9AA3BF] focus:border-[#213C93] focus:ring-2 focus:ring-[#213C93]/20 focus:outline-none';

export function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function FieldError({ errors, name }) {
    const msg =
        errors?.[name]?.[0] ??
        (name === 'attachments'
            ? Object.entries(errors ?? {}).find(([k]) =>
                  k.startsWith('attachments.'),
              )?.[1]?.[0]
            : null);
    return msg ? <p className="mt-1 text-xs text-red-600">{msg}</p> : null;
}

/**
 * Writes and sends an email through the dashboard.
 * - mode "reply": `replyTo` is the visitor (fixed recipient), posts to /spa/admin/inbox/{id}/reply.
 * - mode "new": free To / CC / BCC, posts to /spa/admin/emails.
 * `onSent(email, counts)` runs after a successful send; on failure the draft stays and
 * `onFailed(email)` gets the stored failed email (it can be retried from the Sent list).
 * Both also get the id of the earlier failed attempt this send replaced, if any.
 */
export default function EmailComposer({
    mode = 'new',
    replyTo,
    contactMessageId,
    defaultSubject = '',
    initialTo = '',
    onSent,
    onFailed,
    onCancel,
    autoFocus = true,
}) {
    const [to, setTo] = useState(initialTo);
    const [cc, setCc] = useState('');
    const [bcc, setBcc] = useState('');
    const [showCc, setShowCc] = useState(false);
    const [subject, setSubject] = useState(defaultSubject);
    const [body, setBody] = useState('');
    const [quote, setQuote] = useState(true);
    const [files, setFiles] = useState([]);
    const [sending, setSending] = useState(false);
    const [errors, setErrors] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    // Id of this draft's last failed attempt — the next send replaces it on the server.
    const [failedId, setFailedId] = useState(null);
    const fileInput = useRef(null);

    const addFiles = (list) => {
        const incoming = Array.from(list ?? []);
        const tooBig = incoming.filter((f) => f.size > MAX_FILE_BYTES);
        const accepted = incoming.filter((f) => f.size <= MAX_FILE_BYTES);
        const next = [...files, ...accepted].slice(0, MAX_FILES);
        setFiles(next);
        if (tooBig.length)
            setErrorMsg(
                `Too large (max 10 MB each): ${tooBig.map((f) => f.name).join(', ')}`,
            );
        else if (files.length + accepted.length > MAX_FILES)
            setErrorMsg(`You can attach up to ${MAX_FILES} files.`);
        else setErrorMsg('');
        if (fileInput.current) fileInput.current.value = '';
    };

    const send = async (e) => {
        e.preventDefault();
        setSending(true);
        setErrors(null);
        setErrorMsg('');

        const data = new FormData();
        if (mode === 'new') {
            data.append('to', to);
            if (bcc) data.append('bcc', bcc);
        } else {
            data.append('quote', quote ? '1' : '0');
        }
        if (cc) data.append('cc', cc);
        data.append('subject', subject);
        data.append('body', body);
        files.forEach((f) => data.append('attachments[]', f));
        if (failedId) data.append('replaces', String(failedId));

        const url =
            mode === 'reply'
                ? `/spa/admin/inbox/${contactMessageId}/reply`
                : '/spa/admin/emails';

        try {
            const res = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrf(),
                },
                body: data,
            });
            const json = await res.json().catch(() => ({}));

            if (res.ok) {
                onSent?.(json.email, json.counts, failedId);
                return;
            }
            if (json.errors) setErrors(json.errors);
            setErrorMsg(
                json.errors
                    ? (json.errors.email?.[0] ??
                          'Please check the highlighted fields.')
                    : (json.message ?? 'The email could not be sent.'),
            );
            if (json.email) {
                onFailed?.(json.email, json.counts, failedId);
                setFailedId(json.email.id);
            }
        } catch {
            setErrorMsg(
                'Network error — the email was not sent. Check your connection and try again.',
            );
        } finally {
            setSending(false);
        }
    };

    return (
        <form onSubmit={send} className="space-y-3">
            {mode === 'reply' ? (
                <p className="text-xs text-[#5A6A9A]">
                    To:{' '}
                    <span className="font-semibold text-[#0D1B4B]">
                        {replyTo}
                    </span>
                    {!showCc && (
                        <button
                            type="button"
                            onClick={() => setShowCc(true)}
                            className="ml-3 font-semibold text-[#213C93] hover:underline"
                        >
                            Add CC
                        </button>
                    )}
                </p>
            ) : (
                <div>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            placeholder="To — info@moalloul.com, another@example.com"
                            aria-label="To"
                            required
                            autoFocus={autoFocus}
                            className={FIELD}
                        />
                        {!showCc && (
                            <button
                                type="button"
                                onClick={() => setShowCc(true)}
                                className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-[#213C93] hover:bg-[#E8EAF6]"
                            >
                                CC / BCC
                            </button>
                        )}
                    </div>
                    <FieldError errors={errors} name="to" />
                </div>
            )}

            {showCc && (
                <div
                    className={
                        mode === 'new' ? 'grid gap-3 sm:grid-cols-2' : ''
                    }
                >
                    <div>
                        <input
                            type="text"
                            value={cc}
                            onChange={(e) => setCc(e.target.value)}
                            placeholder="CC"
                            aria-label="CC"
                            className={FIELD}
                        />
                        <FieldError errors={errors} name="cc" />
                    </div>
                    {mode === 'new' && (
                        <div>
                            <input
                                type="text"
                                value={bcc}
                                onChange={(e) => setBcc(e.target.value)}
                                placeholder="BCC"
                                aria-label="BCC"
                                className={FIELD}
                            />
                            <FieldError errors={errors} name="bcc" />
                        </div>
                    )}
                </div>
            )}

            <div>
                <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject"
                    aria-label="Subject"
                    required
                    maxLength={255}
                    className={FIELD}
                />
                <FieldError errors={errors} name="subject" />
            </div>

            <div>
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={
                        mode === 'reply'
                            ? 'Write your reply…'
                            : 'Write your message…'
                    }
                    aria-label="Message"
                    required
                    rows={mode === 'reply' ? 6 : 9}
                    dir="auto"
                    autoFocus={autoFocus && mode === 'reply'}
                    className={`${FIELD} resize-y leading-relaxed`}
                />
                <FieldError errors={errors} name="body" />
                <p className="mt-1 text-xs text-[#9AA3BF]">
                    Your signature from Email Settings is added automatically.
                </p>
            </div>

            {files.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                    {files.map((f, i) => (
                        <li
                            key={`${f.name}-${i}`}
                            className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-[#D1D5E8] bg-[#F7F8FB] py-1 pr-1 pl-2.5 text-xs text-[#0D1B4B]"
                        >
                            <Paperclip
                                size={12}
                                className="shrink-0 text-[#5A6A9A]"
                            />
                            <span className="truncate">{f.name}</span>
                            <span className="shrink-0 text-[#9AA3BF]">
                                {formatBytes(f.size)}
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    setFiles(files.filter((_, j) => j !== i))
                                }
                                aria-label={`Remove ${f.name}`}
                                className="rounded p-0.5 text-[#5A6A9A] hover:bg-red-50 hover:text-red-600"
                            >
                                <X size={12} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <FieldError errors={errors} name="attachments" />

            {errorMsg && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span className="break-words">{errorMsg}</span>
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-3">
                    <input
                        ref={fileInput}
                        type="file"
                        multiple
                        accept={ACCEPT}
                        className="hidden"
                        onChange={(e) => addFiles(e.target.files)}
                    />
                    <button
                        type="button"
                        onClick={() => fileInput.current?.click()}
                        disabled={files.length >= MAX_FILES}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#D1D5E8] bg-white px-3 py-2 text-xs font-semibold text-[#5A6A9A] transition hover:border-[#213C93]/50 hover:text-[#213C93] disabled:opacity-50"
                    >
                        <Paperclip size={13} /> Attach
                    </button>
                    {mode === 'reply' && (
                        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-[#5A6A9A]">
                            <input
                                type="checkbox"
                                checked={quote}
                                onChange={(e) => setQuote(e.target.checked)}
                                className="h-3.5 w-3.5 accent-[#213C93]"
                            />
                            Include their original message
                        </label>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={sending}
                            className="rounded-xl px-4 py-2 text-xs font-semibold text-[#5A6A9A] hover:bg-[#F1F1F0]"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={sending}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#213C93] px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#2E52C9] disabled:opacity-60"
                    >
                        {sending ? (
                            <Loader2 size={13} className="animate-spin" />
                        ) : (
                            <Send size={13} />
                        )}
                        {sending ? 'Sending…' : 'Send'}
                    </button>
                </div>
            </div>
        </form>
    );
}
