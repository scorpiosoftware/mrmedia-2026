import { ImageOff, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * A received email's content. HTML is shown in a sandboxed frame: scripts can't run (no
 * `allow-scripts`), forms can't submit, links open in a new tab, and remote images stay
 * blocked (they can track opens) until "Show images" is clicked.
 */
export default function EmailBody({ email }) {
    const [showHtml, setShowHtml] = useState(Boolean(email.has_html));

    if (!email.has_html || !showHtml) {
        return (
            <div>
                <p
                    className="text-sm break-words whitespace-pre-wrap text-[#0D1B4B]"
                    dir="auto"
                >
                    {email.body || '(no text)'}
                </p>
                {email.has_html && (
                    <button
                        type="button"
                        onClick={() => setShowHtml(true)}
                        className="mt-2 text-xs font-semibold text-[#213C93] hover:underline"
                    >
                        Show formatted version
                    </button>
                )}
            </div>
        );
    }

    return <HtmlFrame email={email} onPlainText={() => setShowHtml(false)} />;
}

function HtmlFrame({ email, onPlainText }) {
    const [images, setImages] = useState(false);
    const [doc, setDoc] = useState(null);
    const [remote, setRemote] = useState(false);
    const [error, setError] = useState(false);
    const [height, setHeight] = useState(120);
    const frame = useRef(null);

    useEffect(() => {
        let cancelled = false;
        fetch(
            `/spa/admin/emails/${email.id}/html${images ? '?images=1' : ''}`,
            {
                credentials: 'include',
                headers: { Accept: 'application/json' },
            },
        )
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((json) => {
                if (cancelled) return;
                setDoc(json.html);
                setRemote(json.remote_images);
            })
            .catch(() => !cancelled && setError(true));
        return () => {
            cancelled = true;
        };
    }, [email.id, images]);

    // Size the frame to its content (allowed because the frame is same-origin but script-free).
    const measure = () => {
        const body = frame.current?.contentDocument?.body;
        if (body)
            setHeight(Math.min(4000, Math.max(60, body.scrollHeight + 8)));
    };

    // Re-measure whenever the email's content changes size (fonts, images loading, "Show images").
    const observer = useRef(null);
    const onLoad = () => {
        measure();
        observer.current?.disconnect();
        const body = frame.current?.contentDocument?.body;
        if (body && typeof ResizeObserver === 'function') {
            observer.current = new ResizeObserver(measure);
            observer.current.observe(body);
        }
    };

    useEffect(() => () => observer.current?.disconnect(), []);

    if (error) {
        return (
            <p className="text-sm text-red-700">
                Could not load this email.{' '}
                <button
                    type="button"
                    onClick={onPlainText}
                    className="font-semibold underline"
                >
                    Show plain text
                </button>
            </p>
        );
    }

    if (!doc) {
        return <Loader2 size={18} className="animate-spin text-[#213C93]" />;
    }

    return (
        <div>
            {remote && !images && (
                <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg bg-[#F1F2F6] px-3 py-1.5 text-xs text-[#5A6A9A]">
                    <ImageOff size={13} />
                    Remote images are blocked to protect your privacy.
                    <button
                        type="button"
                        onClick={() => setImages(true)}
                        className="font-semibold text-[#213C93] hover:underline"
                    >
                        Show images
                    </button>
                </div>
            )}
            <iframe
                ref={frame}
                title={`Email: ${email.subject}`}
                srcDoc={doc}
                sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                referrerPolicy="no-referrer"
                onLoad={onLoad}
                className="w-full rounded-lg border border-[#E3E6F0] bg-white"
                style={{ height }}
            />
            <button
                type="button"
                onClick={onPlainText}
                className="mt-1 text-xs font-semibold text-[#5A6A9A] hover:text-[#213C93]"
            >
                Show plain text
            </button>
        </div>
    );
}
