export const Stat = ({
	label,
	value,
}: {
	label: React.ReactNode;
	value: React.ReactNode;
}) => {
	return (
		<div className="stat">
			<span>{label}</span>
			<strong>{value}</strong>
		</div>
	);
};
