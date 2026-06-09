import { X } from "lucide-react";
import type { ReactNode } from "react";

export const ModalPanel = ({
	children,
	label,
	onClose,
	open,
	title,
}: {
	children: ReactNode;
	label: string;
	onClose: () => void;
	open: boolean;
	title: string;
}) => {
	return open ? (
		<div className="settings-layer">
			<button
				aria-label={`Close ${label.toLowerCase()}`}
				className="settings-backdrop"
				onClick={onClose}
				type="button"
			/>
			<section className="settings-panel" aria-label={label}>
				<div className="settings-header">
					<h2>{title}</h2>
					<button
						className="icon-button compact"
						onClick={onClose}
						title={`Close ${label.toLowerCase()}`}
						type="button"
					>
						<X size={18} />
					</button>
				</div>
				{children}
			</section>
		</div>
	) : null;
};
