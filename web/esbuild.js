import * as esbuild from 'esbuild';

const config = {
    entryPoints: [
        'source/main.ts'
    ],
    bundle: true,
    sourcemap: true,
    target: 'es2024',
    platform: 'browser',
    tsconfig: './tsconfig.json',
    outdir: 'build/',
};

await esbuild.build(config);
