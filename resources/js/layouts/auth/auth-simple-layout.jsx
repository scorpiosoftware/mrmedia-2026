import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { LOGO_DARK_SRC } from '@/lib/brand-logos';
import { home } from '@/routes';

const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    size: 2 + (i % 3),
    left: ((i * 7.3 + 5) % 88) + 6,
    top:  ((i * 13.7 + 10) % 78) + 6,
    delay: (i * 0.38) % 3.2,
    duration: 2 + (i * 0.55 % 2),
}));

const DOT_GRID_A = Array.from({ length: 25 });
const DOT_GRID_B = Array.from({ length: 16 });

export default function AuthSimpleLayout({ children, title, description }) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 overflow-hidden bg-brand-gradient p-6 md:p-10">

            {/* ── Background layer (mirrors Hero) ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">

                <div className="absolute inset-0 bg-white/[0.07] dark:bg-black/25 transition-colors duration-500" />

                {/* Glow orbs */}
                <div
                    className="absolute -top-36 -right-36 w-175 h-175 rounded-full mm-float mm-glow-blue"
                    style={{ background: 'radial-gradient(circle, rgba(46,82,201,0.55) 0%, rgba(33,60,147,0.22) 45%, transparent 70%)' }}
                />
                <div
                    className="absolute -bottom-44 -left-44 w-145 h-145 rounded-full mm-float-rev mm-glow-gold"
                    style={{ background: 'radial-gradient(circle, rgba(221,181,14,0.28) 0%, rgba(221,181,14,0.08) 50%, transparent 70%)', animationDelay: '2s' }}
                />
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-187.5 h-187.5 rounded-full mm-float-slow"
                    style={{ background: 'radial-gradient(circle, rgba(33,60,147,0.32) 0%, transparent 65%)', animationDelay: '1.2s' }}
                />

                {/* Spinning rings */}
                <div className="absolute top-14 right-14 w-80 h-80 rounded-full border border-white/10 mm-spin-cw" />
                <div className="absolute top-24 right-24 w-55 h-55 rounded-full border border-[#DDB50E]/18 mm-spin-ccw" />
                <div className="absolute bottom-28 left-24 w-45 h-45 rounded-full border border-white/8 mm-spin-cw" style={{ animationDelay: '4s' }} />
                <div className="absolute bottom-36 left-32 w-27.5 h-27.5 rounded-full border border-[#DDB50E]/12 mm-spin-ccw" style={{ animationDelay: '2s' }} />

                {/* Dot grids */}
                <div className="absolute top-28 left-14 mm-float-x" style={{ animationDelay: '1.5s' }}>
                    <div className="grid grid-cols-5 gap-2.5">
                        {DOT_GRID_A.map((_, i) => (
                            <div key={i} className="w-0.75 h-0.75 rounded-full bg-white/22" />
                        ))}
                    </div>
                </div>
                <div className="absolute bottom-28 right-20 mm-float-x" style={{ animationDelay: '0.6s' }}>
                    <div className="grid grid-cols-4 gap-2.5">
                        {DOT_GRID_B.map((_, i) => (
                            <div key={i} className="w-0.75 h-0.75 rounded-full bg-[#DDB50E]/35" />
                        ))}
                    </div>
                </div>

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }}
                />

                {/* Particles */}
                {PARTICLES.map(({ id, size, left, top, delay, duration }) => (
                    <div
                        key={id}
                        className="absolute rounded-full bg-white mm-twinkle"
                        style={{ width: `${size}px`, height: `${size}px`, left: `${left}%`, top: `${top}%`, animationDelay: `${delay}s`, animationDuration: `${duration}s` }}
                    />
                ))}

                {/* Floating logo */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[-52%] mm-float-slow pointer-events-none select-none"
                    style={{ opacity: 0.13, animationDelay: '3s' }}
                >
                    <img
                        src={LOGO_DARK_SRC}
                        alt=""
                        aria-hidden="true"
                        className="w-72 sm:w-96 md:w-120 object-contain"
                        style={{ filter: 'blur(0.8px) drop-shadow(0 0 48px rgba(46,82,201,0.9)) drop-shadow(0 0 96px rgba(46,82,201,0.5))' }}
                    />
                </div>
            </div>

            {/* ── Form card ── */}
            <div className="relative z-10 w-full max-w-sm">
                <div className="flex flex-col gap-8 rounded-2xl border border-[#D1D5E8] bg-white px-8 py-10 shadow-[0_8px_48px_rgba(33,60,147,0.35)] dark:bg-[#0D1B4B] dark:border-[#2E52C9]/60">
                    <div className="flex flex-col items-center gap-4">
                        <Link href={home()} className="flex flex-col items-center gap-2 font-medium">
                            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-[#213C93] shadow-[0_0_18px_rgba(46,82,201,0.45)]">
                                <AppLogoIcon className="size-8 fill-current text-white" />
                            </div>
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-1.5 text-center">
                            <h1 className="text-xl font-bold text-[#0D1B4B] dark:text-white">{title}</h1>
                            <p className="text-sm text-muted-foreground dark:text-white/65">{description}</p>
                        </div>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
