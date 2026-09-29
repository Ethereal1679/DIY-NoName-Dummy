function dedent(strings, ...values) {
	const text = Array.isArray(strings) && strings.raw
		? String.raw(strings, ...values)
		: String(strings);
	const lines = text.replace(/\r\n/g, "\n").split("\n");
	while (lines.length && lines[0].trim() === "") lines.shift();
	while (lines.length && lines[lines.length - 1].trim() === "") lines.pop();
	const indent = lines
		.filter((line) => line.trim())
		.reduce((min, line) => Math.min(min, line.match(/^\s*/)[0].length), Infinity);
	return lines.map((line) => line.slice(indent === Infinity ? 0 : indent)).join("\n");
}

export default dedent;
