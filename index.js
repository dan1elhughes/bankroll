// Pre-checked environment variables
const env = require('./env');

// Routing
const micro = require('micro');
const { withNamespace, router, post, get } = require('microrouter');

// OAuth clients
const OAuth = require('./oauth');

// Database models
const database = require('./database');
const { State, User } = require('./models');

// Queue and jobs
const Queue = require('better-queue');
const capBalance = require('./jobs/cap-balance');
const sendNotification = require('./jobs/send-notification');

// HTTP utils
const redirect = require('./micro/redirect');
const query = require('./micro/query');
const bail = require('./micro/bail');

// Helpers (todo)
const registerWebhook = require('./registerWebhook');
const { getAppUrl } = require('./utils');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Boot setup
database.sync({ force: false });

const monzoOAuth = new OAuth.Monzo({
	client_id: env.MONZO_CLIENT_ID,
	client_secret: env.MONZO_CLIENT_SECRET,
});

const truelayerOAuth = new OAuth.Truelayer({
	client_id: env.TRUELAYER_CLIENT_ID,
	client_secret: env.TRUELAYER_CLIENT_SECRET,
});

// Serial queue setup
const capQueue = new Queue(async (user, done) => {
	console.log('Processing queue item...');

	// Wait for any previous transactions to reflected in the balance.
	// I'd love a better way to do this, but Monzo API responses are
	// eventually (not immediately) consistent.
	await sleep(1000);

	try {
		const excess = await capBalance(user);
		if (excess > 0) await sendNotification(user, excess);

		done();
	} catch (e) {
		done(e);
	}
});

const monzoNamespace = withNamespace('/monzo');
const truelayerNamespace = withNamespace('/truelayer');

module.exports = router(
	monzoNamespace(
		get('/auth', async (req, res) => {
			const statusCode = 302;

			const redirect_uri = getAppUrl() + '/monzo/auth/callback';
			const { id: state } = await State.create();

			const redirectURL = monzoOAuth.getAuthUrl(redirect_uri, state);
			redirect(res, statusCode, redirectURL);
		}),

		get('/auth/callback', async req => {
			const { code, state } = query(req);

			const existingState = await State.findByPk(state);
			if (!existingState) bail('Failed state check');

			const redirect_uri = getAppUrl() + '/monzo/auth/callback';
			const {
				access_token,
				expires_in,
				refresh_token,
				user_id,
			} = await monzoOAuth.exchangeCodeForToken(redirect_uri, code);

			const user = await monzoOAuth.store({
				access_token,
				expires_in,
				refresh_token,
				user_id,
			});

			const api = await user.getMonzoClient();

			// This is a bit of a hack - assume that one user
			// has one Retail account. This assumption might
			// not always hold true.
			const { accounts } = await api.accounts({ account_type: 'uk_retail' });
			const [account] = accounts;
			const monzo_account_id = account.id;
			api.account_id = account.id;
			await user.update({
				monzo_account_id,
			});

			await api.createFeedItem({
				type: 'basic',
				'params[title]': 'Bankroll connected',
				'params[body]': 'Authorized successfully',
				'params[image_url]': 'https://i.imgur.com/tONcN2I.png',
			});

			const url = getAppUrl() + '/monzo/webhook';
			await registerWebhook(api, { url, clean: true });

			return { connected: true };
		}),

		post('/webhook', async req => {
			const body = await micro.json(req);
			console.log(`Webhook triggered for transaction: ${body.data.id}`);

			const monzo_account_id = body.data.account_id;
			const user = await User.findOne({ where: { monzo_account_id } });
			if (!user) bail(`No user found for account ${monzo_account_id}`);

			// This is queued because we receive two webhooks
			// instead of one due to a double webhook registration.
			// This queue has a concurrency of one, meaning we
			// finish processing one webhook before starting on
			// the next.
			capQueue.push(user);

			return 'ok';
		})
	),
	truelayerNamespace(
		get('/auth', async (req, res) => {
			const statusCode = 302;

			const redirect_uri = getAppUrl() + '/truelayer/auth/callback';
			const { id: state } = await State.create();

			const redirectURL = truelayerOAuth.getAuthUrl(redirect_uri, state);
			redirect(res, statusCode, redirectURL);
		}),
		get('/auth/callback', async req => {
			const { code, state } = query(req);

			const existingState = await State.findByPk(state);
			if (!existingState) bail('Failed state check');

			const redirect_uri = getAppUrl() + '/truelayer/auth/callback';
			const { refresh_token } = await truelayerOAuth.exchangeCodeForToken(
				redirect_uri,
				code
			);

			const prefix = getAppUrl().includes('localhost') ? '' : 'heroku run -- ';
			const namespace = getAppUrl().includes('localhost') ? 'local' : 'tasks';

			return {
				message:
					"This bit isn't finished yet. Run this command to complete the initial connection.",
				command: `${prefix}npm run ${namespace}:connect-truelayer $user_id ${refresh_token}`,
			};
		})
	),
	get('/*', async () => {
		bail('Not found', 400);
	})
);

(async () => {
	const error = await database.authenticate();
	if (error) {
		console.log(error);
		process.exit(1);
	}
})();
