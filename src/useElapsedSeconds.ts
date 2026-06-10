import { useEffect, useMemo, useState } from "react";
import { getElapsedSeconds } from "./gameState";
import { useGame } from "./SudokuContext";

export const useElapsedSeconds = () => {
	const { state } = useGame();
	const [now, setNow] = useState(Date.now());

	useEffect(() => {
		if (state.completedAt || state.pausedAt) {
			return;
		}

		const interval = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(interval);
	}, [state.completedAt, state.pausedAt]);

	return useMemo(() => {
		return getElapsedSeconds(state, now);
	}, [now, state]);
};
