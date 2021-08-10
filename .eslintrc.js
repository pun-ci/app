module.exports = {
    root: true,
    env: {
        node: true
    },
    extends: [
        'eslint:recommended',
    ],
    overrides: [
        {
            files: ['**/*.ts'],
            extends: [
                'plugin:@typescript-eslint/recommended',
                'standard-with-typescript',
            ],
            parser: '@typescript-eslint/parser',
            plugins: [
                '@typescript-eslint',
            ],
            parserOptions: {
                project: './tsconfig.json'
            },
            rules: {
                '@typescript-eslint/indent': ['error', 4],
                '@typescript-eslint/space-before-function-paren': 'off',
                '@typescript-eslint/strict-boolean-expressions': 'off',
                '@typescript-eslint/explicit-function-return-type': 'off',
                '@typescript-eslint/restrict-template-expressions': 'off',
                '@typescript-eslint/consistent-type-assertions': 'off',
            }
        }
    ],
    rules: {
        'indent': ['error', 4],
        'padded-blocks': 'off',
        'prefer-regex-literals': 'off',
        'max-len': ['error', { code: 100 }],
        'no-console': ['error', { allow: ['warn', 'error', 'info'] }]
    }
}
