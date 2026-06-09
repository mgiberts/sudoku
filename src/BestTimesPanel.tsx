import { Trash2 } from "lucide-react";
import { formatDuration } from "./formatDuration";
import { ModalPanel } from "./ModalPanel";
import { difficultyLabels, difficultyOptions } from "./ModalSettings";
import { BEST_TIME_ERROR_LIMITS } from "./storage";
import type { BestTimes } from "./types";

export const BestTimesPanel = ({
	bestTimes,
	onClose,
	onReset,
	open,
}: {
	bestTimes: BestTimes;
	onClose: () => void;
	onReset: () => void;
	open: boolean;
}) => {
	return (
		<ModalPanel
			label="Best times"
			onClose={onClose}
			open={open}
			title="Best Times"
		>
			<div className="best-times-list">
				{difficultyOptions.map((difficulty) => {
					const score = bestTimes[difficulty];
					const isOverLimit =
						score !== undefined &&
						score.errors >= BEST_TIME_ERROR_LIMITS[difficulty];

					return (
						<div className="best-time-row" key={difficulty}>
							<strong>{difficultyLabels[difficulty]}</strong>
							<span>{score ? formatDuration(score.seconds) : "--"}</span>
							<span className={isOverLimit ? "score-errors over-limit" : ""}>
								{score ? `${score.errors} errors` : "--"}
							</span>
						</div>
					);
				})}
			</div>
			<button
				className="secondary-action reset-scores"
				onClick={onReset}
				type="button"
			>
				<Trash2 size={18} />
				Reset Best Times
			</button>
		</ModalPanel>
	);
};
