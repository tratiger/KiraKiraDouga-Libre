import * as MaterialIcons from "@vicons/material";

const capitalize = (name: string) => name[0].toUpperCase() + name.slice(1);

export default function Icon({ name, style = "round" }: {
	/** アイコン名。 */
	name: MaterialIcon.Names;
	/** アイコンのスタイル：塗りつぶし、アウトライン、角丸、2色、シャープ。デフォルトは角丸です。 */
	style?: MaterialIcon.Styles;
}) {
	const Icon = MaterialIcons[(capitalize(name) + capitalize(style)) as never] as () => JSX.Element;
	return (
		<NIcon>
			<Icon />
		</NIcon>
	);
}
