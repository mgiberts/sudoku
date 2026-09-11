import { describe, expect, it, vi } from "vitest";
import {
	addSample,
	emptyMetrics,
	newSample,
	summarizeMetrics,
} from "./generationMetrics";

describe("generation metrics", () => {
	it("includes failed requests in cost per accepted board, with bounded samples", () => {
		const metrics = emptyMetrics();
		const failed = {
			...newSample("master", "bun", "greedy"),
			durationMs: 3000,
			attempts: 10,
			rejections: { "too-easy": 10 },
		};
		addSample(metrics, failed);
		expect(
			Object.values(summarizeMetrics(metrics))[0].costPerAcceptedMs,
		).toBeNull();
		addSample(metrics, { ...failed, durationMs: 1000, accepted: true });
		const report = Object.values(summarizeMetrics(metrics))[0];
		expect(report.meanSuccessfulMs).toBe(1000);
		expect(report.costPerAcceptedMs).toBe(4000);
		expect(report.attempts).toBe(20);
		for (let i = 0; i < 220; i++) addSample(metrics, failed);
		expect(Object.values(metrics.groups)[0].samples).toHaveLength(200);
		expect(Object.values(metrics.groups)[0].requests).toBe(222);
	});
});

it("persists diagnostics, exports them, and resets without affecting play", async () => {
	const { generationDiagnostics, recordGeneration, recordGenerationEvent } =
		await import("./generationMetrics");
	generationDiagnostics.reset();
	recordGeneration({
		...newSample("hard", "browser-worker", "greedy"),
		durationMs: 123,
		accepted: true,
	});
	recordGenerationEvent("hard", "cache-miss");
	expect(generationDiagnostics.report().events["hard/cache-miss"]).toBe(1);
	expect(
		Object.keys(JSON.parse(generationDiagnostics.export()).groups),
	).toHaveLength(1);
	generationDiagnostics.reset();
	expect(generationDiagnostics.report()).toEqual({ summary: {}, events: {} });
});

it("keeps play and in-memory diagnostics working when storage writes fail", async () => {
	const { generationDiagnostics, recordGeneration } = await import(
		"./generationMetrics"
	);
	generationDiagnostics.reset();
	const write = vi
		.spyOn(Storage.prototype, "setItem")
		.mockImplementation(() => {
			throw new Error("Storage full");
		});
	try {
		expect(() =>
			recordGeneration({
				...newSample("master", "browser-worker", "greedy"),
				accepted: true,
				durationMs: 50,
			}),
		).not.toThrow();
		expect(
			Object.values(generationDiagnostics.report().summary)[0]
				.costPerAcceptedMs,
		).toBe(50);
	} finally {
		write.mockRestore();
		generationDiagnostics.reset();
	}
});
