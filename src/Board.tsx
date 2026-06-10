import { useSettings } from "./SettingsContext";
import { useGame } from "./SudokuContext";

export const Board = () => {
	const { state, dispatch } = useGame();
	const {
		settings: { emptyCellDisplay, inputStyle, numberColorScheme, symbolSet },
		symbols,
		digits,
		numberClasses,
	} = useSettings();
	const selectedCell = state.cells[state.selectedIndex];
	const selectedValue = selectedCell?.value;
	const activeDigit =
		inputStyle === "flow" ? state.selectedDigit : selectedValue;

	return (
		<div
			className={`grid9 board symbol-${symbolSet} numbers-${numberColorScheme} empty-display-${emptyCellDisplay}`}
		>
			{state.cells.map((cell, index) => {
				const row = Math.floor(index / 9);
				const col = index % 9;
				const sameUnit =
					row === Math.floor(state.selectedIndex / 9) ||
					col === state.selectedIndex % 9 ||
					(Math.floor(row / 3) ===
						Math.floor(Math.floor(state.selectedIndex / 9) / 3) &&
						Math.floor(col / 3) === Math.floor((state.selectedIndex % 9) / 3));
				const matchingValue =
					cell.value !== null &&
					activeDigit !== null &&
					cell.value === activeDigit;

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
							cell.value === null && cell.notes.length === 0 ? "empty" : "",
							cell.invalid ? "invalid" : "",
							state.selectedIndex === index ? "selected" : "",
							sameUnit ? "same-unit" : "",
							matchingValue ? "matching-value" : "",
							cornerClass,
						]
							.filter(Boolean)
							.join(" ")}
						key={`${state.seed}-${row}-${col}`}
						onClick={() =>
							dispatch({
								type: inputStyle === "flow" ? "select-and-enter" : "select",
								index,
							})
						}
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
	);
};
