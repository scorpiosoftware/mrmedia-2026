/**
 * Placeholder for the whole home page while site content loads (first visit and
 * language switches). Each block mirrors the real section's background, spacing,
 * grid and card shapes so nothing jumps when the content arrives.
 */

/** A shimmering placeholder block; `light` is for dark or gradient backgrounds. */
function Bone({ className = '', light = false, style }) {
    return (
        <div
            className={`${light ? 'mm-bone-light' : 'mm-bone'} rounded-md ${className}`}
            style={style}
        />
    );
}

const CONTAINER = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8';

/** Centered badge + title + subtitle, as used by most sections. */
function SectionHeader({ margin = 'mb-16' }) {
    return (
        <div className={`${margin} flex flex-col items-center`}>
            <Bone className="mb-3 h-7 w-32 rounded-full" />
            <Bone className="h-9 w-72 max-w-full sm:h-11 lg:h-12 lg:w-96" />
            <Bone className="mt-5 h-4 w-full max-w-xl" />
            <Bone className="mt-2 h-4 w-2/3 max-w-md" />
        </div>
    );
}

function NavbarSkeleton() {
    return (
        <div className="absolute inset-x-0 top-0 z-10">
            <div className={CONTAINER}>
                <div className="flex h-16 items-center justify-between lg:h-20">
                    <div className="flex items-center gap-2.5">
                        <Bone light className="h-11 w-11 rounded-xl" />
                        <Bone light className="h-6 w-28" />
                    </div>
                    <div className="hidden items-center gap-8 lg:flex">
                        {[64, 80, 80, 56, 72].map((w, i) => (
                            <Bone
                                key={i}
                                light
                                className="h-3.5"
                                style={{ width: w }}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-3">
                        <Bone
                            light
                            className="hidden h-8 w-14 rounded-full sm:block"
                        />
                        <Bone light className="h-9 w-9 rounded-full" />
                        <Bone
                            light
                            className="hidden h-10 w-32 rounded-full sm:block"
                        />
                        <Bone light className="h-9 w-9 rounded-lg lg:hidden" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/** `split` mirrors the hero's two-column layout used when a hero image is set. */
function HeroSkeleton({ split = false }) {
    return (
        <section className="bg-brand-gradient relative flex min-h-screen items-center overflow-hidden">
            <NavbarSkeleton />
            <div className={`relative w-full ${CONTAINER} pt-28 pb-28`}>
                <div
                    className={
                        split
                            ? 'grid items-center gap-12 lg:grid-cols-2 lg:gap-16'
                            : undefined
                    }
                >
                    <div
                        className={`flex flex-col items-center text-center ${split ? 'lg:items-start' : ''}`}
                    >
                        <Bone light className="mb-8 h-10 w-60 rounded-full" />
                        <Bone
                            light
                            className="mb-4 h-12 w-full max-w-3xl sm:h-16 md:h-20"
                        />
                        <Bone
                            light
                            className="mb-6 h-12 w-2/3 max-w-xl sm:h-16 md:h-20"
                        />
                        <Bone
                            light
                            className="mb-2 h-4 w-full max-w-2xl sm:h-5"
                        />
                        <Bone
                            light
                            className="mb-12 h-4 w-3/4 max-w-xl sm:h-5"
                        />
                        <div
                            className={`flex flex-wrap justify-center gap-4 ${split ? 'lg:justify-start' : ''}`}
                        >
                            <Bone light className="h-14 w-52 rounded-full" />
                            <Bone light className="h-14 w-44 rounded-full" />
                        </div>
                    </div>
                    {split && (
                        <Bone
                            light
                            className="mx-auto aspect-square w-full max-w-md rounded-3xl lg:max-w-none"
                        />
                    )}
                </div>
            </div>
            {/* Same wave divider as the real hero */}
            <div className="absolute right-0 bottom-0 left-0">
                <svg
                    viewBox="0 0 1440 80"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                >
                    <path
                        d="M0 80L1440 80L1440 40C1200 80 720 0 0 40L0 80Z"
                        className="fill-brand-bg"
                    />
                </svg>
            </div>
        </section>
    );
}

function StatsSkeleton() {
    return (
        <section className="bg-brand-dark py-20 dark:bg-primary-dark">
            <div className={CONTAINER}>
                <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <Bone light className="h-12 w-28 sm:h-15" />
                            <div className="mx-auto mt-3 mb-3 h-px w-12 bg-white/15" />
                            <Bone light className="h-3 w-24" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function ServicesSkeleton() {
    return (
        <section className="bg-white py-24 dark:bg-brand-dark">
            <div className={CONTAINER}>
                <SectionHeader />
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-2xl border border-border bg-brand-bg p-8 dark:border-primary-light/40 dark:bg-primary-dark"
                        >
                            <Bone className="mb-5 h-13 w-13 rounded-xl" />
                            <Bone className="mb-4 h-5 w-2/3" />
                            <Bone className="mb-2 h-3.5 w-full" />
                            <Bone className="mb-2 h-3.5 w-11/12" />
                            <Bone className="h-3.5 w-3/5" />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function MarqueeSkeleton() {
    return (
        <section className="overflow-hidden bg-white dark:bg-brand-dark">
            <div className="flex items-center gap-8 overflow-hidden bg-brand-blue px-6 py-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Bone
                        key={i}
                        light
                        className={`h-7 shrink-0 sm:h-8 ${i % 2 ? 'w-44' : 'w-56'}`}
                    />
                ))}
            </div>
        </section>
    );
}

function PortfolioSkeleton() {
    return (
        <section className="bg-brand-bg py-24 dark:bg-brand-dark">
            <div className={CONTAINER}>
                <SectionHeader margin="mb-12" />
                <div className="mb-10 flex flex-wrap justify-center gap-2">
                    {[64, 96, 88, 80].map((w, i) => (
                        <Bone
                            key={i}
                            className="h-9 rounded-full"
                            style={{ width: w }}
                        />
                    ))}
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="mm-bone relative aspect-4/3 rounded-2xl"
                        >
                            <div className="absolute inset-x-6 bottom-6">
                                <Bone className="mb-2 h-3 w-20" />
                                <Bone className="h-5 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function EventsSkeleton() {
    return (
        <section className="bg-brand-bg py-24 dark:bg-brand-dark">
            <div className={CONTAINER}>
                <SectionHeader margin="mb-12" />
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex flex-col overflow-hidden rounded-2xl border border-border bg-white dark:border-primary-light/40 dark:bg-primary-dark"
                        >
                            <div className="mm-bone aspect-video w-full" />
                            <div className="flex flex-1 flex-col p-6">
                                <div className="mb-3 flex gap-2">
                                    <Bone className="h-6 w-20 rounded-full" />
                                    <Bone className="h-6 w-16 rounded-full" />
                                </div>
                                <Bone className="mb-3 h-5 w-3/4" />
                                <Bone className="mb-2 h-3.5 w-1/2" />
                                <Bone className="mb-2 h-3.5 w-2/5" />
                                <Bone className="mb-5 h-3.5 w-1/3" />
                                <Bone className="mt-auto h-10 w-full rounded-xl" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function AboutSkeleton() {
    return (
        <section className="bg-white py-24 dark:bg-primary-dark">
            <div className={CONTAINER}>
                <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                    <div className="relative order-2 lg:order-1">
                        <div className="mm-bone relative aspect-4/3 rounded-3xl">
                            <div className="absolute right-8 bottom-8 left-8 h-20 rounded-2xl bg-white/40 dark:bg-white/5" />
                        </div>
                        <div className="mm-bone absolute -top-4 -right-4 h-24 w-28 rounded-2xl" />
                    </div>
                    <div className="order-1 lg:order-2">
                        <Bone className="mb-3 h-7 w-28 rounded-full" />
                        <Bone className="mb-2 h-9 w-4/5 sm:h-11 lg:h-12" />
                        <Bone className="mb-6 h-9 w-1/2 sm:h-11 lg:h-12" />
                        {[100, 95, 90, 60].map((w, i) => (
                            <Bone
                                key={i}
                                className="mb-2.5 h-4"
                                style={{ width: `${w}%` }}
                            />
                        ))}
                        <div className="mt-6 mb-8 rounded-2xl border-l-4 border-border bg-brand-bg p-6 rtl:border-r-4 rtl:border-l-0 dark:bg-brand-dark">
                            <Bone className="mb-3 h-3 w-24" />
                            <Bone className="mb-2 h-4 w-full" />
                            <Bone className="h-4 w-2/3" />
                        </div>
                        <div className="mb-8 grid grid-cols-2 gap-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-2"
                                >
                                    <Bone className="h-4 w-4 shrink-0 rounded-full" />
                                    <Bone className="h-4 w-3/4" />
                                </div>
                            ))}
                        </div>
                        <Bone className="h-12 w-52 rounded-full" />
                    </div>
                </div>
            </div>
        </section>
    );
}

function TestimonialsSkeleton() {
    return (
        <section className="bg-brand-bg py-24 dark:bg-brand-dark">
            <div className={CONTAINER}>
                <SectionHeader />
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex flex-col rounded-2xl border border-border bg-white p-8 dark:border-primary-light/40 dark:bg-primary-dark"
                        >
                            <Bone className="mb-4 h-7 w-7" />
                            <Bone className="mb-2 h-4 w-full" />
                            <Bone className="mb-2 h-4 w-11/12" />
                            <Bone className="mb-2 h-4 w-full" />
                            <Bone className="mb-6 h-4 w-1/2" />
                            <div className="flex items-center gap-3">
                                <Bone className="h-10 w-10 shrink-0 rounded-full" />
                                <div className="flex-1">
                                    <Bone className="mb-1.5 h-3.5 w-28" />
                                    <Bone className="h-3 w-20" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function ContactSkeleton() {
    return (
        <section className="bg-white py-24 dark:bg-brand-dark">
            <div className={CONTAINER}>
                <div className="grid gap-16 lg:grid-cols-2">
                    <div>
                        <Bone className="mb-3 h-7 w-32 rounded-full" />
                        <Bone className="mb-4 h-9 w-3/4 sm:h-11 lg:h-12" />
                        <Bone className="mb-2 h-4 w-full max-w-md" />
                        <Bone className="mb-10 h-4 w-2/3 max-w-sm" />
                        <div className="space-y-5">
                            {[56, 44, 64].map((w, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-4"
                                >
                                    <Bone className="h-11 w-11 shrink-0 rounded-xl" />
                                    <Bone
                                        className="h-4 flex-1"
                                        style={{ maxWidth: w * 4 }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-5 rounded-3xl border border-border bg-brand-bg p-8 dark:border-primary-light/40 dark:bg-primary-dark">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i}>
                                <Bone className="mb-2 h-3 w-24" />
                                <Bone className="h-11.5 w-full rounded-xl" />
                            </div>
                        ))}
                        <div>
                            <Bone className="mb-2 h-3 w-28" />
                            <Bone className="h-28 w-full rounded-xl" />
                        </div>
                        <Bone className="h-12 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        </section>
    );
}

function FooterSkeleton() {
    return (
        <footer className="bg-brand-dark dark:bg-[color-mix(in_srgb,var(--color-brand-dark)_60%,black)]">
            <div className={`${CONTAINER} py-16`}>
                <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="lg:col-span-2">
                        <Bone light className="mb-4 h-8 w-40" />
                        <Bone light className="mb-2 h-3.5 w-full max-w-xs" />
                        <Bone light className="h-3.5 w-2/3 max-w-48" />
                        <div className="mt-6 flex gap-3">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Bone
                                    key={i}
                                    light
                                    className="h-10 w-10 rounded-full"
                                />
                            ))}
                        </div>
                    </div>
                    {[5, 3].map((rows, col) => (
                        <div key={col}>
                            <Bone light className="mb-5 h-3 w-24" />
                            <div className="space-y-3">
                                {Array.from({ length: rows }).map((_, i) => (
                                    <Bone
                                        key={i}
                                        light
                                        className={`h-3.5 ${i % 2 ? 'w-24' : 'w-32'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-12 flex justify-center border-t border-white/10 pt-8">
                    <Bone light className="h-3.5 w-64" />
                </div>
            </div>
        </footer>
    );
}

export default function HomeSkeleton({ heroImage = false }) {
    return (
        <div role="status" aria-busy="true" aria-live="polite">
            <span className="sr-only">Loading…</span>
            <main aria-hidden="true">
                <HeroSkeleton split={heroImage} />
                <StatsSkeleton />
                <ServicesSkeleton />
                <MarqueeSkeleton />
                <PortfolioSkeleton />
                <EventsSkeleton />
                <AboutSkeleton />
                <TestimonialsSkeleton />
                <ContactSkeleton />
            </main>
            <div aria-hidden="true">
                <FooterSkeleton />
            </div>
        </div>
    );
}
