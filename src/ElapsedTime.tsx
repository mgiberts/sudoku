import { formatDuration } from "./formatDuration";
import { Stat } from "./Stat";
import { useElapsedSeconds } from "./useElapsedSeconds";

export const ElapsedTime = () => {
	const elapsedSeconds = useElapsedSeconds();

	return <Stat label="Time" value={formatDuration(elapsedSeconds)} />;
};
