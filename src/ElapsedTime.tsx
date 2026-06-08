import { Stat } from "./Stat";
import { useElapsedSeconds } from "./useElapsedSeconds";

export const ElapsedTime = () => {
	const elapsedSeconds = useElapsedSeconds();

	return <Stat label="Time" value={formatDuration(elapsedSeconds)} />;
};

export const formatDuration = (seconds: number): string => {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;

	return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};
