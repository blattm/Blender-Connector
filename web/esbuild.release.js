import * as esbuild from 'esbuild';

const config = {
    entryPoints: [
        'source/main.ts'
    ],
    bundle: true,
    minify: true,
    target: 'es2024',
    platform: 'browser',
    tsconfig: './tsconfig.release.json',
    outdir: 'build/',
};

await esbuild.build(config);
