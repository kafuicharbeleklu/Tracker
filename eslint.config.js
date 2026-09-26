import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { fixupPluginRules } from '@eslint/compat';

export default tseslint.config(
    { ignores: ['dist'] },
    {
        extends: [
            js.configs.recommended,
            ...tseslint.configs.recommended,
        ],
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        plugins: {
            'react-hooks': fixupPluginRules(reactHooks),
            'react-refresh': fixupPluginRules(reactRefresh),
        },
        rules: {
            // Keep only core hook safety to avoid blocking delivery with
            // React Compiler-oriented lint rules on this legacy codebase.
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'error',

            // Gradual typing hardening: re-enable core TS safety rules.
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_',
            }],
            '@typescript-eslint/no-unused-expressions': 'off',
            'no-useless-assignment': 'off',
            'no-unused-vars': 'off',

            // Reduce warning-only churn while max-warnings is zero.
            'react-refresh/only-export-components': 'off',
        },
    },
);
