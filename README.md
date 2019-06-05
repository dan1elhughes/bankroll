# Monzo balance manager

> Caps a Monzo account to a certain amount, sweeping any excess into a specified Pot.

A webhook is registered automatically, so the account cap can be checked on every transaction event.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## Usage

- Create an account at https://developers.monzo.com.

- Click the button above.

- Set the required variables in setup as prompted:

```bash
ACCESS_TOKEN="" # Your access token from developers.monzo.com
ACCOUNT_ID="" #Your account ID from developers.monzo.com
CAP="" # The amount to cap your current account to (GBP).
DESTINATION_POT="" # The name of the pot to send the excess to.
```

- Make a POST request to /webhook:

```bash
$ curl -X POST your-app.herokuapp.com/webhook
```
