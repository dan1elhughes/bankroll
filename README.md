# Salary sweep

> Caps a Monzo account to a certain amount, sweeping any excess into a specified Pot.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## Usage

Set the required variables in setup:

```
ACCESS_TOKEN=""
ACCOUNT_ID=""
CAP=""
DESTINATION_POT=""
```

Make a POST request to /webhook:

```bash
$ curl -X POST your-app.herokuapp.com/webhook
```

## Todo

- Register the webhook automatically.
