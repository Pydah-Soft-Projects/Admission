'use client';

import dynamic from 'next/dynamic';

const DotLottieReact = dynamic(
    () => import('@lottiefiles/dotlottie-react').then((m) => m.DotLottieReact),
    { ssr: false }
);

const LOTTIE_URL = 'https://lottie.host/7bde9ffc-f400-4088-8ca7-05b5e0685303/tRfjBeuQhH.lottie';

export function Loading() {
    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-slate-950 p-6">
            <div className="relative w-full max-w-[280px] sm:max-w-[320px] md:max-w-[400px] aspect-square flex flex-col items-center justify-center">
                <DotLottieReact
                    src={LOTTIE_URL}
                    loop
                    autoplay
                    className="w-full h-full"
                />
                <div className="mt-2 text-center">
                    <p className="text-sm sm:text-base font-semibold text-slate-600 dark:text-slate-300 animate-pulse tracking-wide">
                        Preparing workspace
                    </p>
                    <div className="mt-1.5 flex justify-center gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]"></span>
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.15s]"></span>
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500"></span>
                    </div>
                </div>
            </div>
        </div>
    );
}
