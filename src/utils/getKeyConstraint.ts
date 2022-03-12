const getKeyConstraint = (constraint: string, possibleKeys: string[]) => {
	let key = '';
	possibleKeys.forEach((possibleKey) => {
		if (constraint.includes(possibleKey) && key === '') {
			key = possibleKey;
		}
	});
	return key;
};

export default getKeyConstraint;
