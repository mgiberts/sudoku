import { useEffect, useMemo, useState } from "react";
import { useGame } from "./SudokuContext";

export const useElapsedSeconds = () => {
	const { state } = useGame();
	const [now, setNow] = useState(Date.now());

	useEffect(() => {
		if (state.completedAt) {
			return;
		}

		const interval = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(interval);
	}, [state.completedAt]);

	return useMemo(() => {
		const end = state.completedAt ?? now;
		return Math.max(0, Math.floor((end - state.startedAt) / 1000));
	}, [now, state.completedAt, state.startedAt]);
};
