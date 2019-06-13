module.exports = async user => {
	const { cap, excess_balance_pot } = user;

	const api = user.getMonzoClient();
	const { balance } = await api.balance();

	const excess = balance - cap;
	if (excess <= 0) return 0;
	await api.deposit(excess_balance_pot, excess);
	return excess;
};
