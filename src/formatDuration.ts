export const formatDuration = (seconds: number): string => {
	const hours = Math.floor(seconds / (60 * 60));
	const minutes = Math.floor((seconds % (60 * 60)) / 60);
	const remainingSeconds = seconds % 60;

	if (hours > 0) {
		return `${hours}h ${String(minutes).padStart(2, "0")}m`;
	}

	if (minutes > 0) {
		return `${String(minutes).padStart(2, "0")}m ${String(
			remainingSeconds,
		).padStart(2, "0")}s`;
	}

	return `${String(remainingSeconds).padStart(2, "0")}s`;
};
