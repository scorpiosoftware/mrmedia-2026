import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/spa.jsx',   // Pure React SPA (portfolio + admin)
            ],
            refresh: true,
        }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'resources/js'),
        },
    },
    build: {
        rolldownOptions: {
            // Plugin time is dominated by the React Compiler (babel) by design — not actionable.
            checks: { pluginTimings: false },
            output: {
                // Libraries change far less often than app code: separate chunks stay cached across deploys.
                codeSplitting: {
                    groups: [
                        {
                            name: 'react',
                            test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                            priority: 20,
                        },
                        {
                            name: 'router',
                            test: /node_modules[\\/](react-router|react-router-dom)[\\/]/,
                            priority: 15,
                        },
                        {
                            name: 'vendor',
                            test: /node_modules[\\/]/,
                            priority: 10,
                        },
                    ],
                },
            },
        },
    },
});
