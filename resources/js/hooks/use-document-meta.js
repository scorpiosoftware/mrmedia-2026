import { useEffect } from 'react';

function setMetaTag(attr, value, content) {
    let tag = document.querySelector(`meta[${attr}="${value}"]`);
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, value);
        document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
}

/**
 * Keeps the tab title and description/OG meta tags in sync on client-side
 * route changes (the initial HTML is already correct per-route via the
 * server, this only matters once React Router navigates without a reload).
 */
export function useDocumentMeta({ title, description }) {
    useEffect(() => {
        if (title) {
            document.title = title;
            setMetaTag('property', 'og:title', title);
            setMetaTag('name', 'twitter:title', title);
        }

        if (description) {
            setMetaTag('name', 'description', description);
            setMetaTag('property', 'og:description', description);
            setMetaTag('name', 'twitter:description', description);
        }
    }, [title, description]);
}
