module.exports = {
	env: {
		node: true,
		es2022: true
	},
	extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module'
	},
	plugins: ['@typescript-eslint'],
	rules: {
		'no-mixed-spaces-and-tabs': 'off',
		'no-case-declarations': 'off'
	},
	ignorePatterns: ['dist', 'node_modules', '**/migrations/**']
}
