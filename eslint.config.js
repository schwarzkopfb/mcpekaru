import tseslint from 'typescript-eslint';

export default tseslint.config({
  files: ['scripts/**/*.ts', 'src/**/*.ts', 'test/**/*.ts'],
  languageOptions: {
    parser: tseslint.parser,
  },
  plugins: {
    '@typescript-eslint': tseslint.plugin,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
  },
});
