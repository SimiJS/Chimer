import tseslint from '@electron-toolkit/eslint-config-ts'
import eslintPluginReact from 'eslint-plugin-react'
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh'
import eslintPluginPrettier from 'eslint-plugin-prettier'

const prettierConfig = {
	plugins: {
		prettier: eslintPluginPrettier
	},
	rules: {
		'prettier/prettier': [
			'error',
			{
				useTabs: true
			}
		]
	}
}

export default tseslint.config(
	{ ignores: ['**/node_modules', '**/dist', '**/out'] },
	tseslint.configs.recommended,
	eslintPluginReact.configs.flat.recommended,
	eslintPluginReact.configs.flat['jsx-runtime'],
	{
		settings: {
			react: {
				version: 'detect'
			}
		},
		parserOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			ecmaFeatures: {
				jsx: true
			}
		}
	},
	{
		files: ['**/*.{ts,tsx,js,jsx}'],
		plugins: {
			'react-hooks': eslintPluginReactHooks,
			'react-refresh': eslintPluginReactRefresh
		},
		rules: {
			...eslintPluginReactHooks.configs.recommended.rules,
			...eslintPluginReactRefresh.configs.vite.rules
		}
	},
	prettierConfig
)
