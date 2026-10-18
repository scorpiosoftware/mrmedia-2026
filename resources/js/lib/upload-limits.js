// Largest image the admin can upload. Mirrors ImageOptimizer::MAX_UPLOAD_KB on the server.
export const MAX_UPLOAD_MB = 16;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
export const MAX_UPLOAD_LABEL = `${MAX_UPLOAD_MB}MB`;
export const TOO_LARGE_MESSAGE = `Image must be ${MAX_UPLOAD_LABEL} or smaller.`;
