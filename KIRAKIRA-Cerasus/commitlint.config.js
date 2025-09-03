import { RuleConfigSeverity } from "@commitlint/types";

/** @type {import("@commitlint/types").UserConfig} */
export default {
	extends: ["@commitlint/config-conventional"],
	rules: {
		"body-full-stop": [RuleConfigSeverity.Disabled, "never", [".", "。"]],
		"body-leading-blank": [RuleConfigSeverity.Error, "always"],
		"body-max-line-length": [RuleConfigSeverity.Warning, "always", 100000],
		"subject-case": [RuleConfigSeverity.Error, "never",
			["sentence-case", "start-case", "pascal-case", "upper-case", "snake-case"],
		],
		"subject-full-stop": [RuleConfigSeverity.Error, "never", [".", "。"]],
		"scope-case": [RuleConfigSeverity.Error, "always", "lower-case"],
		"type-enum": [RuleConfigSeverity.Error, "always",
			["build", "chore", "conflict", "ci", "delete", "docs", "feat", "fix", "font", "perf", "refactor", "revert", "stash", "style", "test", "try"],
		],
	},
	prompt: {
		settings: {
			enableMultipleScopes: true,
			scopeEnumSeparator: ",",
		},
		messages: {
			skip: "（Enterでスキップ）",
			max: "最大 %d 文字",
			min: "最小 %d 文字",
			emptyWarning: "入力は必須です",
			upperLimitWarning: "文字数が上限を超えています",
			lowerLimitWarning: "文字数が足りません",
		},
		questions: {
			type: {
				description: "コミットする変更の種類を選択してください",
				enum: {
					feat: {
						description: "新機能の追加",
						title: "Features",
						emoji: "✨",
					},
					fix: {
						description: "バグの修正",
						title: "Bug Fixes",
						emoji: "🐛",
					},
					docs: {
						description: "ドキュメントの変更",
						title: "Documentation",
						emoji: "📚",
					},
					style: {
						description: "コードの意味に影響しないスタイルの変更（スペース、フォーマット、セミコロン抜けなど）",
						title: "Styles",
						emoji: "💎",
					},
					refactor: {
						description: "バグ修正でも機能追加でもないコードのリファクタリング",
						title: "Code Refactoring",
						emoji: "📦",
					},
					perf: {
						description: "パフォーマンスの最適化",
						title: "Performance Improvements",
						emoji: "🚀",
					},
					test: {
						description: "テストの追加または修正",
						title: "Tests",
						emoji: "🚨",
					},
					build: {
						description: "ビルドシステムや外部依存関係に影響する変更（例: gulp, broccoli, npm）",
						title: "Builds",
						emoji: "🛠",
					},
					ci: {
						description: "CI用の設定ファイルやスクリプトの変更（例: Travis, Circle, BrowserStack, SauceLabs）",
						title: "Continuous Integrations",
						emoji: "⚙️",
					},
					chore: {
						description: "ソースコードやテストファイル以外の変更",
						title: "Chores",
						emoji: "♻️",
					},
					revert: {
						description: "過去のバージョンへのロールバック",
						title: "Reverts",
						emoji: "🗑",
					},
					conflict: {
						description: "コンフリクトの修正",
						title: "Conflict",
						emoji: "🥊",
					},
					font: {
						description: "フォントファイルの更新",
						title: "Fonts",
						emoji: "🔣",
					},
					delete: {
						description: "機能やファイルの削除",
						title: "Delete Features or Files",
						emoji: "🚮",
					},
					stash: {
						description: "一時的なファイルの保存",
						title: "Stash Files",
						emoji: "🗃️",
					},
					try: {
						description: "何らかの試行錯誤。動作しないがバックアップのためにコミット",
						title: "Try Something Useless",
						emoji: "🤷",
					},
				},
			},
			scope: {
				description: "この変更のスコープは何ですか（例: コンポーネントやファイル名、複数ある場合はカンマで区切る）",
			},
			subject: {
				description: "変更内容を簡潔に記述してください",
			},
			body: {
				description: "変更内容をより詳しく記述してください",
			},
			isBreaking: {
				description: "破壊的変更はありますか？",
			},
			breakingBody: {
				description: "破壊的変更のあるコミットには説明が必要です。詳しい説明を入力してください",
			},
			breaking: {
				description: "破壊的変更の内容を記述してください",
			},
			isIssueAffected: {
				description: "この変更はオープンなIssueに影響しますか？",
			},
			issuesBody: {
				description: "このコミットで閉じられるIssueがある場合、説明が必要です。説明を入力してください",
			},
			issues: {
				description: "既存のIssueを1つ以上追加してください（例: \"fix #123\", \"re #123\"、複数を閉じる例: \"fix #1, fix #2\"）",
			},
		},
	},
};
