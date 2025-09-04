// @ts-check

import TypescriptEslint from 'typescript-eslint';
import EslintConfigPhosphor from 'eslint-config-phosphor';

export default TypescriptEslint.config(
    EslintConfigPhosphor.default,
    {
        files: ["**/*.ts"],
        languageOptions: {
            ecmaVersion: 2024,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
);
