import { useEffect } from "react";
import { isDigitComplete } from "./gameState";
import { useSettings } from "./SettingsContext";
import { useGame } from "./SudokuContext";
import type { Digit } from "./types";

export const Keypad = () => {
	const { state, dispatch } = useGame();
	const {
		settings: { inputStyle, numberColorScheme, symbolSet },
		symbols,
		digits,
		numberClasses,
	} = useSettings();
	const selectedCell =
		state.selectedIndex === null ? undefined : state.cells[state.selectedIndex];
	const selectedValue = selectedCell?.value;
	const activeDigit =
		inputStyle === "flow" ? state.selectedDigit : selectedValue;

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (/^[1-9]$/.test(event.key)) {
				const digit = Number(event.key) as Digit;
				dispatch({
					type: inputStyle === "flow" ? "select-digit" : "enter",
					digit,
				});
				return;
			}

			if (event.key === "Backspace" || event.key === "Delete") {
				dispatch({ type: "erase" });
			}
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [dispatch, inputStyle]);

	return (
		<fieldset className={`grid9 keypad numbers-${numberColorScheme}`}>
			<legend>Number entry</legend>
			{digits.map((digit) => {
				const disabled = isDigitComplete(state.cells, digit);

				return (
					<button
						aria-label={
							disabled
								? `${digit} complete`
								: inputStyle === "flow"
									? `Select ${digit}`
									: `Enter ${digit}`
						}
						className={`key symbol-${symbolSet} ${
							numberClasses[digit - 1]
						} ${activeDigit === digit ? "selected-value" : ""}`}
						disabled={disabled}
						key={digit}
						onClick={() =>
							dispatch({
								type: inputStyle === "flow" ? "select-digit" : "enter",
								digit,
							})
						}
						type="button"
					>
						{symbols[digit]}
					</button>
				);
			})}
		</fieldset>
	);
};
