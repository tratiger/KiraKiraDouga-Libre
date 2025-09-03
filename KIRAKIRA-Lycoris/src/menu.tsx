interface MenuItem {
	label: string;
	to?: string;
	key: string;
	icon: MaterialIcon.Names;
	shown?: boolean;
	children?: MenuItem[];
}

const selfUserInfo = noBackend ? null! : await getSelfUserInfo(undefined, false); // Piniaを更新せず、データのみ取得

const menu: MenuItem[] = [
	{
		label: "ダッシュボード",
		to: "/",
		key: "",
		icon: "dashboard",
	},
	{
		label: "ユーザー",
		key: "user",
		icon: "group",
		children: [
			{
				label: "ユーザー管理",
				key: "manage",
				icon: "manageAccounts",
			},
			{
				label: "最近の変更",
				key: "recent",
				icon: "history",
			},
			{
				label: "ユーザーブロック",
				key: "block",
				icon: "block",
			},
		],
	},
	{
		label: "動画",
		key: "video",
		icon: "videoLibrary",
		children: [
			{
				label: "動画管理",
				key: "manage",
				icon: "videoSettings",
			},
			{
				label: "動画レビュー",
				key: "pending-review",
				icon: "approval",
			},
		],
	},
	{
		label: "タグ",
		key: "tag",
		icon: "sell",
		children: [
			{
				label: "タグ管理",
				key: "manage",
				icon: "sell",
			},
			{
				label: "最近の変更",
				key: "recent",
				icon: "history",
			},
		],
	},
	{
		label: "RBAC 管理",
		key: "rbac",
		icon: "shield",
		shown: checkUserRole(["root", "developer"], selfUserInfo),
		children: [
			{
				label: "API パス",
				key: "api-path",
				icon: "api",
			},
			{
				label: "ロール",
				key: "role",
				icon: "badge",
			},
			{
				label: "ユーザーロール",
				key: "user-roles",
				icon: "person",
			},
		],
	},
	{
		label: "ステージング環境シークレット",
		key: "stg-secret",
		icon: "key",
		shown: checkUserRole(["root", "developer"], selfUserInfo),
	},
	{
		label: "このアプリについて",
		key: "about",
		icon: "info",
	},
];

const menuOptions = (() => {
	function getMenuOptions({ label, to, key, icon, shown, children }: MenuItem, parentKeys: string[] = []): MenuOption {
		const keys = [...parentKeys, key], keysRoute = "/" + keys.join("/");
		if (!children) to ??= keysRoute;
		const menuOption: MenuOption = {
			label: () => to != null ? <RouterLink to={to}>{label}</RouterLink> : label,
			key: keysRoute,
			icon: () => <Icon name={icon} />,
			show: shown,
			children: children ? children.map(item => getMenuOptions(item, keys)) : undefined,
		};
		return menuOption;
	}

	return menu.map(item => getMenuOptions(item));
})();

export default menuOptions;
