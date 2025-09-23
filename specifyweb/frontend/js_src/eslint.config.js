import globals from "globals";

// For estlintConfig
import parser from "@typescript-eslint/parser";
import restrictedGlobals from "confusing-browser-globals";
import typescript from "@typescript-eslint/eslint-plugin";
import markdown from "eslint-plugin-markdown";
import promise from "eslint-plugin-promise";
import sonarjs from "eslint-plugin-sonarjs";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import regexp from "eslint-plugin-regexp";
import tsdoc from "eslint-plugin-tsdoc";
import comments from "eslint-plugin-write-good-comments";
import functional from "eslint-plugin-functional";
import jest from "eslint-plugin-jest";
import jestDom from "eslint-plugin-jest-dom";
import arrayFunc from "eslint-plugin-array-func";
import typescriptEslint from "@typescript-eslint/eslint-plugin/dist/configs/eslint-recommended.js";
import typescriptRecommended from "@typescript-eslint/eslint-plugin/dist/configs/recommended.js";
import typescriptRecommendedTyped from "@typescript-eslint/eslint-plugin/dist/configs/recommended-requiring-type-checking.js";
import typescriptStrict from "@typescript-eslint/eslint-plugin/dist/configs/strict.js";
import unicornRecommended from "eslint-plugin-unicorn/configs/recommended.js";
import eslintComments from "eslint-plugin-eslint-comments/lib/configs/recommended.js";

// For eslintConfigReact
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import accessibility from "eslint-plugin-jsx-a11y";
import testingLibrary from "eslint-plugin-testing-library";
import { FlatCompat } from "@eslint/eslintrc";

const eslintConfig = (() => {
	"use strict";

	const OFF = "off";
	const WARN = "warn";
	const ERROR = "error";

	const compat = new FlatCompat();

	const replacementsConfig = {
		props: {
			properties: false,
		},
		Props: {
			properties: false,
		},
		ref: {
			reference: false,
		},
		i: {
			index: false,
		},
		args: {
			arguments: false,
		},
	};

	const testFiles = [
		"**/__tests__/**/*.[jt]s?(x)",
		"**/?(*.)+(spec|test).[tj]s?(x)",
	];

	const testRules = {
		"jest/consistent-test-it": [ERROR, { fn: "test", withinDescribe: "test" }],
		"jest/max-expects": WARN,
		"jest/max-nested-describe": ERROR,
		"jest/no-test-return-statement": ERROR,
		"jest/prefer-called-with": WARN,
		"jest/prefer-comparison-matcher": ERROR,
		"jest/prefer-equality-matcher": ERROR,
		"jest/prefer-expect-resolves": WARN,
		"jest/prefer-hooks-in-order": ERROR,
		"jest/prefer-hooks-on-top": ERROR,
		"jest/prefer-mock-promise-shorthand": WARN,
		"jest/prefer-spy-on": WARN,
		"jest/prefer-todo": ERROR,
		"jest/require-hook": WARN,
		"jest/require-to-throw-message": WARN,
		"jest/no-large-snapshots": [WARN, { maxSize: 50, inlineMaxSize: 25 }],
		"jest/no-deprecated-functions": OFF,
		"jest/valid-title": OFF,
		"@typescript-eslint/no-magic-numbers": WARN,
	};

	const config = [
		"eslint:recommended",
		...typescriptEslint.overrides,
		...compat.config(unicornRecommended),
		...compat.config(arrayFunc.configs.all),
		...compat.config(eslintComments),
		...compat.config(regexp.configs.recommended),
		...compat.config(functional.configs["external-typescript-recommended"]),
		...compat.config(functional.configs.recommended),
		...compat.config(functional.configs["no-object-orientation"]),
		...compat.config(functional.configs["no-statements"]),
		...compat.config(functional.configs["no-exceptions"]),
		...compat.config(functional.configs["currying"]),
		...compat.config(functional.configs["stylistic"]),
		...compat.config(promise.configs.recommended),
		...compat.config(sonarjs.configs.recommended),
		{
			languageOptions: {
				parser,
			},
			linterOptions: {
				reportUnusedDisableDirectives: true,
			},
			plugins: {
				"@typescript-eslint": typescript,
				"simple-import-sort": simpleImportSort,
				tsdoc,
				"write-good-comments": comments,
				functional,
				arrayFunc,
			},
			rules: {
				...typescriptRecommended.rules,
				...typescriptRecommendedTyped.rules,
				...typescriptStrict.rules,

				"no-non-null-assertion": OFF,
				"no-console": OFF,
				"no-promise-executor-return": OFF,
				"no-template-curly-in-string": ERROR,
				"no-unsafe-optional-chaining": ERROR,
				"no-useless-backreference": ERROR,
				"array-callback-return": ERROR,
				complexity: [WARN, { max: 10 }],
				"consistent-return": OFF,
				"default-case": ERROR,
				"default-case-last": ERROR,
				"guard-for-in": ERROR,
				"no-restricted-syntax": [
					ERROR,
					"CatchClause",
					"Class",
					"ContinueStaement",
					"DoWhileStatementView",
					"ForStatement",
					"LabeledStatement",
					"SwitchCase",
					"SwitchStatement",
					"ForInStatement",
					"Tools.Generator",
					"TryStatement",
					"WithStatement",
				],
				"no-alert": ERROR,
				"no-caller": ERROR,
				"no-constructor-return": ERROR,
				"no-eq-null": ERROR,
				"no-eval": ERROR,
				"no-extend-native": ERROR,
				"no-extra-bind": ERROR,
				"no-implicit-coercion": ERROR,
				"no-iterator": ERROR,
				"no-labels": ERROR,
				"no-new": WARN,
				"no-new-func": ERROR,
				"no-new-wrappers": ERROR,
				"no-nonoctal-decimal-escape": ERROR,
				"no-octal-escape": ERROR,
				"no-param-reassign": ERROR,
				"no-proto": ERROR,
				"no-return-assign": ERROR,
				"no-script-url": ERROR,
				"no-self-compare": ERROR,
				"no-sequences": ERROR,
				"no-useless-call": ERROR,
				"no-useless-concat": ERROR,
				"no-useless-return": OFF,
				"no-warning-comments": [
					ERROR,
					{
						terms: ["fixme"],
						location: "anywhere",
					},
				],
				"prefer-named-capture-group": ERROR,
				"prefer-promise-reject-errors": ERROR,
				"prefer-regex-literals": ERROR,
				yoda: ERROR,
				camelcase: OFF,
				"capitalized-comments": ERROR,
				"consistent-this": ERROR,
				"max-lines": [
					WARN,
					{
						max: 300,
						skipBlankLines: true,
						skipComments: true,
					},
				],
				"max-lines-per-function": [
					WARN,
					{
						max: 100,
						skipBlankLines: true,
						skipComments: true,
					},
				],
				"max-params": WARN,
				"max-statements": [
					WARN,
					{
						max: 20,
					},
				],
				"max-statements-per-line": ERROR,
				"multiline-comment-style": ERROR,
				"new-cap": ERROR,
				"no-bitwise": ERROR,
				"no-continue": ERROR,
				"no-inline-comments": ERROR,
				"no-extra-boolean-cast": OFF,
				"no-multi-assign": ERROR,
				"no-new-object": ERROR,
				"no-plusplus": ERROR,
				"no-unneeded-ternary": ERROR,
				"one-var": [ERROR, "never"],
				"prefer-exponentiation-operator": ERROR,
				"prefer-object-spread": ERROR,
				"spaced-comment": ERROR,
				"no-useless-computed-key": ERROR,
				"no-useless-rename": ERROR,
				"no-var": ERROR,
				"object-shorthand": ERROR,
				"prefer-const": ERROR,
				"prefer-numeric-literals": ERROR,
				"prefer-rest-params": ERROR,
				"prefer-spread": ERROR,
				"prefer-template": ERROR,
				"symbol-description": ERROR,
				"no-await-in-loop": ERROR,
				"no-constant-binary-expression": ERROR,
				"no-unreachable-loop": ERROR,
				"no-unused-private-class-members": ERROR,
				"require-atomic-updates": ERROR,
				"accessor-pairs": ERROR,
				"arrow-body-style": ERROR,
				"class-methods-use-this": ERROR,
				eqeqeq: ERROR,
				"func-name-matching": ERROR,
				"func-style": [ERROR, "declaration", { allowArrowFunctions: true }],
				"grouped-accessor-pairs": ERROR,
				"max-depth": [WARN, { max: 6 }],
				"max-nested-callbacks": WARN,
				"no-confusing-arrow": OFF,
				"no-floating-decimal": ERROR,
				"no-lone-blocks": ERROR,
				"no-mixed-operators": ERROR,
				"no-multi-str": ERROR,
				"no-restricted-globals": [
					ERROR,
					...new Set([
						...restrictedGlobals,
						"event",
						"name",
						"closed",
						"i",
						"index",
						"length",
						"parent",
						"self",
						"status",
						"stop",
						"toolbar",
						"top",
						"Infinity",
						"NaN",
						"isNaN",
						"isFinite",
						"parseFloat",
						"parseInt",
						"keys",
					]),
				],
				"no-void": OFF,
				"no-undef": OFF,
				"prefer-arrow-callback": [ERROR, { allowNamedFunctions: true }],
				"prefer-object-has-own": ERROR,
				radix: [ERROR, "as-needed"],
				"require-unicode-regexp": ERROR,
				"new-parens": ERROR,
				"logical-assignment-operators": [
					ERROR,
					"always",
					{
						enforceForIfStatements: true,
					},
				],
				"no-new-native-nonconstructor": ERROR,

				"@typescript-eslint/no-unsafe-return": OFF,
				"@typescript-eslint/no-extra-semi": OFF,
				"@typescript-eslint/no-base-to-string": OFF,
				"@typescript-eslint/ban-ts-comment": WARN,
				"@typescript-eslint/array-type": ERROR,
				"@typescript-eslint/ban-tslint-comment": ERROR,
				"@typescript-eslint/class-literal-property-style": [ERROR, "fields"],
				"@typescript-eslint/consistent-indexed-object-style": [ERROR, "record"],
				"@typescript-eslint/consistent-type-assertions": [
					ERROR,
					{
						assertionStyle: "as",
						objectLiteralTypeAssertions: "allow-as-parameter",
					},
				],
				"@typescript-eslint/consistent-type-definitions": [ERROR, "type"],
				"@typescript-eslint/consistent-type-imports": ERROR,
				"@typescript-eslint/explicit-function-return-type": [
					ERROR,
					{
						allowTypedFunctionExpressions: true,
						allowHigherOrderFunctions: true,
						allowDirectConstAssertionInArrowFunctions: true,
						allowConciseArrowFunctionExpressionsStartingWithVoid: true,
					},
				],
				"@typescript-eslint/explicit-module-boundary-types": OFF,
				"@typescript-eslint/explicit-member-accessibility": ERROR,
				"@typescript-eslint/method-signature-style": ERROR,
				"@typescript-eslint/naming-convention": [
					ERROR,
					{
						selector: "default",
						format: ["strictCamelCase", "StrictPascalCase"],
						leadingUnderscore: "allow",
						trailingUnderscore: "forbid",
					},
					{
						selector: "variable",
						modifiers: ["const"],
						types: ["boolean", "string", "number", "array"],
						format: ["strictCamelCase", "StrictPascalCase", "UPPER_CASE"],
					},
					{
						selector: "typeLike",
						format: ["StrictPascalCase"],
					},
					{
						selector: "default",
						modifiers: ["requiresQuotes"],
						format: null,
					},
					{
						selector: "typeParameter",
						format: ["UPPER_CASE"],
					},
					{
						selector: "enumMember",
						format: ["UPPER_CASE"],
					},
				],
				"@typescript-eslint/no-confusing-non-null-assertion": ERROR,
				"@typescript-eslint/no-confusing-void-expression": [
					ERROR,
					{
						ignoreArrowShorthand: true,
						ignoreVoidOperator: true,
					},
				],
				"@typescript-eslint/no-dynamic-delete": ERROR,
				"@typescript-eslint/no-extraneous-class": ERROR,
				"@typescript-eslint/no-implicit-any-catch": ERROR,
				"@typescript-eslint/no-invalid-void-type": [
					ERROR,
					{
						allowInGenericTypeArguments: true,
						allowAsThisParameter: true,
					},
				],
				"@typescript-eslint/no-require-imports": ERROR,
				"@typescript-eslint/no-unnecessary-boolean-literal-compare": ERROR,
				"@typescript-eslint/no-unnecessary-condition": OFF,
				"@typescript-eslint/no-unnecessary-qualifier": ERROR,
				"@typescript-eslint/no-unnecessary-type-arguments": ERROR,
				"@typescript-eslint/no-unnecessary-type-constraint": ERROR,
				"@typescript-eslint/non-nullable-type-assertion-style": ERROR,
				"@typescript-eslint/prefer-enum-initializers": ERROR,
				"@typescript-eslint/prefer-for-of": ERROR,
				"@typescript-eslint/prefer-function-type": ERROR,
				"@typescript-eslint/prefer-includes": ERROR,
				"@typescript-eslint/prefer-literal-enum-member": ERROR,
				"@typescript-eslint/prefer-nullish-coalescing": ERROR,
				"@typescript-eslint/prefer-optional-chain": ERROR,
				"@typescript-eslint/prefer-readonly": ERROR,
				"@typescript-eslint/prefer-readonly-parameter-types": [
					WARN,
					{
						ignoreInferredTypes: true,
					},
				],
				"@typescript-eslint/prefer-reduce-type-parameter": ERROR,
				"@typescript-eslint/prefer-string-starts-ends-with": ERROR,
				"@typescript-eslint/prefer-ts-expect-error": ERROR,
				"@typescript-eslint/promise-function-async": ERROR,
				"@typescript-eslint/require-array-sort-compare": [
					ERROR,
					{
						ignoreStringArrays: true,
					},
				],
				"@typescript-eslint/strict-boolean-expressions": ERROR,
				"@typescript-eslint/switch-exhaustiveness-check": ERROR,
				"@typescript-eslint/unified-signatures": ERROR,
				"default-param-last": OFF,
				"@typescript-eslint/default-param-last": ERROR,
				"dot-notation": OFF,
				"@typescript-eslint/dot-notation": ERROR,
				"lines-between-class-members": OFF,
				"@typescript-eslint/lines-between-class-members": OFF,
				"no-dupe-class-members": OFF,
				"@typescript-eslint/no-dupe-class-members": ERROR,
				"no-duplicate-imports": OFF,
				"@typescript-eslint/no-duplicate-imports": ERROR,
				"no-invalid-this": OFF,
				"@typescript-eslint/no-invalid-this": OFF,
				"no-loss-of-precision": OFF,
				"@typescript-eslint/no-loss-of-precision": ERROR,
				"no-magic-numbers": OFF,
				"@typescript-eslint/no-magic-numbers": [
					ERROR,
					{
						ignore: [-1, 0, 1, 2],
						ignoreDefaultValues: true,
						ignoreClassFieldInitialValues: true,
						ignoreEnums: true,
						ignoreNumericLiteralTypes: true,
						ignoreTypeIndexes: true,
					},
				],
				"no-redeclare": OFF,
				"@typescript-eslint/no-redeclare": ERROR,
				"no-throw-literal": OFF,
				"@typescript-eslint/no-throw-literal": ERROR,
				"no-unused-expressions": OFF,
				"@typescript-eslint/no-unused-expressions": ERROR,
				"no-useless-constructor": OFF,
				"@typescript-eslint/no-useless-constructor": ERROR,
				"no-return-await": OFF,
				"@typescript-eslint/return-await": ERROR,
				"no-unused-vars": OFF,
				"@typescript-eslint/no-unused-vars": [
					ERROR,
					{
						argsIgnorePattern: "^_",
						varsIgnorePattern: "^_",
					},
				],
				"@typescript-eslint/consistent-type-exports": [
					ERROR,
					{
						fixMixedExportsWithInlineTypeSpecifier: true,
					},
				],
				"@typescript-eslint/member-ordering": ERROR,
				"@typescript-eslint/no-redundant-type-constituents": WARN,
				"@typescript-eslint/no-useless-empty-export": ERROR,
				"@typescript-eslint/sort-type-union-intersection-members": ERROR,
				"no-array-constructor": OFF,
				"@typescript-eslint/no-array-constructor": ERROR,
				"no-empty-function": OFF,
				"@typescript-eslint/no-empty-function": [
					OFF,
					{
						allow: ["arrowFunctions"],
					},
				],
				"no-implied-eval": OFF,
				"@typescript-eslint/no-implied-eval": ERROR,
				"require-await": OFF,
				"@typescript-eslint/require-await": ERROR,
				"@typescript-eslint/no-non-null-assertion": OFF,
				"@typescript-eslint/no-inferrable-types": OFF,
				"@typescript-eslint/no-meaningless-void-operator": OFF,
				"@typescript-eslint/unbound-method": OFF,

				"unicorn/throw-new-error": OFF,
				"unicorn/better-regex": OFF,
				"unicorn/prefer-spread": OFF,
				"unicorn/prefer-switch": OFF,
				"unicorn/empty-brace-spaces": OFF,
				"unicorn/custom-error-definition": ERROR,
				"unicorn/filename-case": OFF,
				"unicorn/prefer-top-level-await": OFF,
				"unicorn/import-style": OFF,
				"unicorn/no-array-callback-reference": OFF,
				"unicorn/no-array-for-each": OFF,
				"unicorn/no-array-reduce": OFF,
				"unicorn/no-console-spaces": OFF,
				"unicorn/no-useless-undefined": OFF,
				"no-lonely-if": OFF,
				"no-nested-ternary": WARN,
				"unicorn/no-nested-ternary": OFF,
				"unicorn/no-lonely-if": ERROR,
				"no-negated-condition": OFF,
				"unicorn/no-negated-condition": ERROR,
				"unicorn/no-new-array": ERROR,
				"unicorn/no-unsafe-regex": ERROR,
				"unicorn/numeric-separators-style": ERROR,
				"unicorn/prefer-array-flat-map": ERROR,
				"unicorn/prefer-query-selector": OFF,
				"unicorn/prefer-string-replace-all": ERROR,
				"unicorn/no-null": OFF,
				"unicorn/prevent-abbreviations": [
					ERROR,
					{
						replacements: replacementsConfig,
						checkShorthandImports: false,
						checkShorthandProperties: false,
					},
				],
				"unicorn/prefer-dom-node-dataset": OFF,
				"unicorn/prefer-at": ERROR,
				"unicorn/prefer-json-parse-buffer": ERROR,
				"unicorn/require-post-message-target-origin": ERROR,
				"unicorn/prefer-array-find": ERROR,

				"eslint-comments/no-unused-disable": ERROR,

				"tsdoc/syntax": WARN,

				"simple-import-sort/imports": WARN,
				"simple-import-sort/exports": WARN,

				"sonarjs/no-duplicate-string": WARN,
				"sonarjs/no-inverted-boolean-check": ERROR,
				"sonarjs/no-nested-template-literals": WARN,
				"sonarjs/cognitive-complexity": [WARN, 30],

				"regexp/no-dupe-disjunctions": ERROR,
				"regexp/no-empty-alternative": ERROR,
				"regexp/no-lazy-ends": ERROR,
				"regexp/no-optional-assertion": ERROR,
				"regexp/no-potentially-useless-backreference": ERROR,
				"regexp/no-useless-assertions": ERROR,
				"regexp/no-useless-dollar-replacements": ERROR,
				"regexp/confusing-quantifier": ERROR,
				"regexp/control-character-escape": ERROR,
				"regexp/negation": ERROR,
				"regexp/no-legacy-features": ERROR,
				"regexp/no-non-standard-flag": ERROR,
				"regexp/no-obscure-range": ERROR,
				"regexp/no-standalone-backslash": ERROR,
				"regexp/no-trivially-nested-assertion": ERROR,
				"regexp/no-trivially-nested-quantifier": ERROR,
				"regexp/no-unused-capturing-group": ERROR,
				"regexp/no-useless-flag": ERROR,
				"regexp/no-useless-lazy": ERROR,
				"regexp/no-useless-non-greedy": ERROR,
				"regexp/no-useless-quantifier": ERROR,
				"regexp/no-useless-range": ERROR,
				"regexp/no-zero-quantifier": ERROR,
				"regexp/optimal-lookaround-quantifier": ERROR,
				"regexp/prefer-escape-replacement-dollar-char": ERROR,
				"regexp/prefer-predefined-assertion": ERROR,
				"regexp/prefer-quantifier": ERROR,
				"regexp/prefer-range": ERROR,
				"regexp/prefer-regexp-exec": ERROR,
				"regexp/prefer-regexp-test": ERROR,
				"regexp/hexadecimal-escape": ERROR,
				"regexp/letter-case": ERROR,
				"regexp/no-useless-escape": ERROR,
				"regexp/no-useless-non-capturing-group": ERROR,
				"regexp/order-in-character-class": ERROR,
				"regexp/prefer-character-class": ERROR,
				"regexp/prefer-named-backreference": ERROR,
				"regexp/prefer-unicode-codepoint-escapes": ERROR,
				"regexp/sort-flags": ERROR,
				"regexp/unicode-escape": ERROR,
				"regexp/no-missing-g-flag": ERROR,
				"regexp/no-extra-lookaround-assertions": ERROR,

				"write-good-comments/write-good-comments": WARN,

				"functional/immutable-data": OFF,
				"functional/no-let": OFF,
				"functional/no-mixed-type": OFF,
				"functional/no-conditional-statement": OFF,
				"functional/no-expression-statement": OFF,
				"functional/no-return-void": OFF,
				"functional/no-promise-reject": OFF,
				"functional/functional-parameters": OFF,
				"functional/no-this-expression": OFF,
				"functional/prefer-tacit": [
					ERROR,
					{ assumeTypes: { allowFixer: false } },
				],

				"promise/always-return": OFF,

				"regexp/no-misleading-capturing-group": ERROR,
			},
		},
		...compat.config(markdown.configs.recommended),
		{
			files: ["**/*.{md}/*.{js,ts,tsx}"],
			rules: {
				"no-undef": OFF,
				"no-unused-expression": OFF,
				"no-unused-var": OFF,
				"no-console": OFF,
			},
		},
		...compat.config(jest.configs.recommended),
		...compat.config(jest.configs.style),
		...compat.config(jestDom.configs.recommended),
		{
			files: testFiles,
			rules: testRules,
		},
	];

	return {
		config,
		replacementsConfig,
		testRules,
		testFiles,
	};
})();

const eslintConfigReact = (() => {
	"use strict";

	const OFF = "off";
	const WARN = "warn";
	const ERROR = "error";

	const compat = new FlatCompat();

	const config = [
		...compat.config(react.configs.recommended),
		...compat.config(reactHooks.configs.recommended),
		...compat.config(accessibility.configs.strict),
		...compat.config(testingLibrary.configs.react),
		{
			rules: {
				"react/prop-types": OFF,
				"react/display-name": WARN,
				"react/button-has-type": ERROR,
				"react/no-access-state-in-setstate": ERROR,
				"react/no-danger": ERROR,
				"react/no-this-in-sfc": ERROR,
				"react/no-unstable-nested-components": ERROR,
				"react/self-closing-comp": ERROR,
				"react/style-prop-object": ERROR,
				"react/void-dom-elements-no-children": ERROR,
				"react/jsx-filename-extension": [
					ERROR,
					{
						extensions: ["tsx"],
					},
				],
				"react/jsx-handler-names": ERROR,
				"react/jsx-no-useless-fragment": [
					ERROR,
					{
						allowExpressions: true,
					},
				],
				"react/jsx-pascal-case": ERROR,
				"react/boolean-prop-naming": ERROR,
				"react/function-component-definition": ERROR,
				/*
				 * Seemed like a good idea at first, but now I am struggling to
				 * find a reason for this rule to exist. IF you accidentally
				 * forgot to unpack a useState, TypeScript will tell you.
				 * Otherwise, I don't want this rule to fire when I intentionally
				 * didn't unpack (because I want to easily pass on both getter
				 * and setter to a child component)
				 */
				"react/hook-use-state": OFF,
				"react/iframe-missing-sandbox": ERROR,
				"react/no-adjacent-inline-elements": ERROR,
				"react/no-invalid-html-attribute": ERROR,
				"react/jsx-boolean-value": ERROR,
				"react/jsx-child-element-spacing": ERROR,
				"react/jsx-curly-brace-presence": [
					ERROR,
					{ propElementValues: "always" },
				],
				"react/jsx-fragments": ERROR,
				"react/jsx-no-constructed-context-values": ERROR,
				"react/jsx-no-leaked-render": OFF,
				"react/jsx-no-literals": ERROR,
				"react/jsx-sort-props": [
					WARN,
					{
						ignoreCase: true,
						callbacksLast: true,
					},
				],
				"react/jsx-uses-vars": ERROR,
				"react/jsx-uses-react": ERROR,
				"react/no-object-type-as-default-prop": ERROR,
				/*
				 * This is a super important rule. Not sure why it's not an ERROR
				 * by default
				 */
				"react-hooks/exhaustive-deps": ERROR,
				// Deprecated rule
				"jsx-a11y/no-onchange": OFF,
				"jsx-a11y/no-noninteractive-element-to-interactive-role": ERROR,
			},
			settings: {
				react: {
					version: "detect",
				},
			},
		},
		{
			files: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[tj]s?(x)"],
			rules: {
				"testing-library/no-await-sync-events": ERROR,
				"testing-library/no-global-regexp-flag-in-query": WARN,
				"testing-library/no-manual-cleanup": ERROR,
				"testing-library/prefer-user-event": ERROR,
				"testing-library/prefer-wait-for": ERROR,
			},
		},
	];

	return config;
})();

const testFiles = eslintConfig.config.find(
	(rules) =>
		typeof rules === "object" &&
		Array.isArray(rules.files) &&
		rules.files.join("_").includes("test"),
)?.files;
if (testFiles === undefined)
	throw new Error("Unable to find test files selector");

const abbreviationsConfig = eslintConfig.config
	.map((rules) =>
		typeof rules === "object" && typeof rules.rules === "object"
			? Object.entries(rules.rules).find(
					([name, options]) =>
						name === "unicorn/prevent-abbreviations" && Array.isArray(options),
				)?.[1]?.[1]
			: undefined,
	)
	.find((options) => typeof options === "object");
if (abbreviationsConfig === undefined)
	throw new Error("Unable to find unicorn/prevent-abbreviations config");

export default [
	...eslintConfig.config,
	...eslintConfigReact,
	{
		languageOptions: {
			sourceType: "module",
			parserOptions: {
				project: "./tsconfig.json",
			},
			globals: {
				...globals.browser,
				...globals.node,
			},
		},
		rules: {
			"@typescript-eslint/no-empty-interface": "off",
			"unicorn/prevent-abbreviations": [
				"error",
				{
					...abbreviationsConfig,
					allowList: {
						...abbreviationsConfig.allowList,
						spAppResourceDir: true,
						SpAppResourceDir: true,
						ScopedAppResourceDir: true,
					},
				},
			],
		},
	},
	{
		files: [...testFiles],
		rules: {
			/*
			 * Tests commonly need to use unusual variable names or mock back-end
			 * responses, which may include variables in a different naming convention
			 */
			"@typescript-eslint/naming-convention": "warn",
		},
	},
];
