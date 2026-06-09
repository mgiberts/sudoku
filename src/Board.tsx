import { isDigitComplete } from "./gameState";
import { useSettings } from "./SettingsContext";
import { useGame } from "./SudokuContext";

export const Board = () => {
	const { state, dispatch } = useGame();
	const {
		settings: { numberColorScheme, symbolSet },
		symbols,
		digits,
		numberClasses,
	} = useSettings();
	const selectedCell = state.cells[state.selectedIndex];
	const selectedValue = selectedCell?.value;

	return (
		<>
			<div className={`board symbol-${symbolSet} numbers-${numberColorScheme}`}>
				{state.cells.map((cell, index) => {
					const row = Math.floor(index / 9);
					const col = index % 9;
					const sameUnit =
						row === Math.floor(state.selectedIndex / 9) ||
						col === state.selectedIndex % 9 ||
						(Math.floor(row / 3) ===
							Math.floor(Math.floor(state.selectedIndex / 9) / 3) &&
							Math.floor(col / 3) ===
								Math.floor((state.selectedIndex % 9) / 3));
					const matchingValue =
						cell.value !== null &&
						selectedCell?.value !== null &&
						cell.value === selectedCell?.value;

					let cornerClass = "";
					switch (`${row}-${col}`) {
						case "0-0":
							cornerClass = "top-left";
							break;
						case "0-8":
							cornerClass = "top-right";
							break;
						case "8-0":
							cornerClass = "bottom-left";
							break;
						case "8-8":
							cornerClass = "bottom-right";
							break;
						default:
					}

					return (
						<button
							aria-label={`Row ${row + 1}, column ${col + 1}`}
							className={[
								"cell",
								cell.given ? "given" : "user-cell",
								cell.invalid ? "invalid" : "",
								state.selectedIndex === index ? "selected" : "",
								sameUnit ? "same-unit" : "",
								matchingValue ? "matching-value" : "",
								cornerClass,
							]
								.filter(Boolean)
								.join(" ")}
							key={`${state.seed}-${row}-${col}`}
							onClick={() => dispatch({ type: "select", index })}
							type="button"
						>
							{cell.value ? (
								<span
									className={`value symbol-${symbolSet} ${
										numberClasses[cell.value - 1]
									}`}
								>
									{symbols[cell.value]}
								</span>
							) : (
								<span className="notes" aria-hidden={cell.notes.length === 0}>
									{digits.map((digit) => (
										<span
											className={`note symbol-${symbolSet} ${
												numberClasses[digit - 1]
											}`}
											key={digit}
										>
											{cell.notes.includes(digit) ? symbols[digit] : ""}
										</span>
									))}
								</span>
							)}
						</button>
					);
				})}
			</div>

			<fieldset className={`keypad numbers-${numberColorScheme}`}>
				<legend>Number entry</legend>
				{digits.map((digit) => {
					const disabled = isDigitComplete(state.cells, digit);

					return (
						<button
							aria-label={disabled ? `${digit} complete` : `Enter ${digit}`}
							className={`key symbol-${symbolSet} ${
								numberClasses[digit - 1]
							} ${selectedValue === digit ? "selected-value" : ""}`}
							disabled={disabled}
							key={digit}
							onClick={() => dispatch({ type: "enter", digit })}
							type="button"
						>
							{symbols[digit]}
						</button>
					);
				})}
			</fieldset>
		</>
	);
};
