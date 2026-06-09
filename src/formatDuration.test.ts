import { describe, expect, it } from "vitest";
import { formatDuration } from "./formatDuration";

describe("formatDuration", () => {
	it("keeps hours unpadded and minutes or seconds padded", () => {
		expect(formatDuration(8)).toBe("08s");
		expect(formatDuration(85)).toBe("01m 25s");
		expect(formatDuration(3600)).toBe("1h 00m");
		expect(formatDuration(4800)).toBe("1h 20m");
	});
});
