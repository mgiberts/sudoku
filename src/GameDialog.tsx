import type { ReactNode } from "react";

export const GameDialog = ({
	actions,
	icon,
	label,
	message,
	title,
	open = false,
}: {
	actions: ReactNode;
	icon: ReactNode;
	label: string;
	message: ReactNode;
	title: string;
	open?: boolean;
}) =>
	open ? (
		<div className="dialog-backdrop" role="presentation">
			<section
				className="dialog"
				role="dialog"
				aria-modal="true"
				aria-label={label}
			>
				{icon}
				<h2>{title}</h2>
				<p>{message}</p>
				<div className="dialog-actions">{actions}</div>
			</section>
		</div>
	) : null;
