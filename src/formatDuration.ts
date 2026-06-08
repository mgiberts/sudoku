export const formatDuration = (seconds: number): string => {
	const hours = Math.floor(seconds / (60 * 60));
	const minutes = Math.floor((seconds % (60 * 60)) / 60);
	const remainingSeconds = seconds % 60;

	const hoursString = hours > 0 ? `${String(hours).padStart(2, "0")}h ` : "";
	const minutesString =
		minutes > 0 ? `${String(minutes).padStart(2, "0")}m ` : "";

	return `${hoursString}${minutesString}${String(remainingSeconds).padStart(2, "0")}s`;
};
