![Banner](https://raw.githubusercontent.com/ktmcp-cli/openbankingproject/main/banner.svg)

> "Six months ago, everyone was talking about MCPs. And I was like, screw MCPs. Every MCP would be better as a CLI."
>
> — [Peter Steinberger](https://twitter.com/steipete), Founder of OpenClaw
> [Watch on YouTube (~2:39:00)](https://www.youtube.com/@lexfridman) | [Lex Fridman Podcast #491](https://lexfridman.com/peter-steinberger/)

# Open Banking Project CLI

> **⚠️ Unofficial CLI** - Not officially sponsored or affiliated with Open Banking Project Switzerland.

A production-ready command-line interface for the [Swiss NextGen Banking API](https://www.openbankingproject.ch/) (Open Banking Project Switzerland). Access account information, initiate payments, manage consents, and check funds directly from your terminal.

## Features

- **Account Information Service (AIS)** — List accounts, balances, and transactions
- **Payment Initiation Service (PIS)** — Initiate and track payments
- **Consent Management** — Create, view, and delete consents for account access
- **Funds Confirmation Service (PIIS)** — Check funds availability
- **PSD2 Compliant** — Built on the Berlin Group NextGenPSD2 Framework v1.3.4
- **Swiss Edition** — Refined for Swiss banking standards
- **JSON output** — All commands support `--json` for scripting
- **Colorized output** — Clean terminal output with chalk

## Installation

```bash
npm install -g @ktmcp-cli/openbankingproject
```

## Quick Start

```bash
# Configure your OAuth2 access token
openbankingproject config set --token YOUR_ACCESS_TOKEN

# List all accounts
openbankingproject accounts list

# Get account balances
openbankingproject accounts balances ACCOUNT_ID

# View recent transactions
openbankingproject accounts transactions ACCOUNT_ID
```

## Commands

### Config

```bash
openbankingproject config set --token <token>
openbankingproject config set --base-url <url>
openbankingproject config show
```

### Accounts

```bash
# List all accounts
openbankingproject accounts list
openbankingproject accounts list --with-balance

# Get account details
openbankingproject accounts show <account-id>
openbankingproject accounts show <account-id> --with-balance

# Get account balances
openbankingproject accounts balances <account-id>

# Get transactions
openbankingproject accounts transactions <account-id>
openbankingproject accounts transactions <account-id> --date-from 2024-01-01
openbankingproject accounts transactions <account-id> --date-from 2024-01-01 --date-to 2024-01-31
openbankingproject accounts transactions <account-id> --booking-status booked
```

### Consents

```bash
# Create consent for specific accounts
openbankingproject consents create --accounts CH9300762011623852957,CH5604835012345678009 --balances --transactions

# Create consent for all accounts
openbankingproject consents create --all-accounts --balances --transactions --valid-until 2024-12-31

# Get consent details
openbankingproject consents show <consent-id>

# Get consent status
openbankingproject consents status <consent-id>

# Delete consent
openbankingproject consents delete <consent-id>
```

### Payments

```bash
# Initiate a SEPA credit transfer
openbankingproject payments initiate \
  --service payments \
  --product sepa-credit-transfers \
  --debtor-iban CH9300762011623852957 \
  --creditor-iban CH5604835012345678009 \
  --creditor-name "John Doe" \
  --amount 100.50 \
  --currency CHF \
  --reference "Invoice payment"

# Get payment status
openbankingproject payments status \
  --service payments \
  --product sepa-credit-transfers \
  --payment-id 12345

# Get payment details
openbankingproject payments details \
  --service payments \
  --product sepa-credit-transfers \
  --payment-id 12345
```

### Funds Confirmation

```bash
# Check if funds are available
openbankingproject check-funds \
  --iban CH9300762011623852957 \
  --amount 1000 \
  --currency CHF
```

## JSON Output

All commands support `--json` for structured output:

```bash
openbankingproject accounts list --json | jq '.accounts[0].iban'
openbankingproject accounts balances <account-id> --json | jq '.balances[0].balanceAmount.amount'
openbankingproject consents show <consent-id> --json | jq '.consentStatus'
```

## Authentication

This CLI uses OAuth2 Bearer token authentication. You'll need to:

1. Register as a Third Party Provider (TPP) with your bank
2. Obtain an OAuth2 access token from your bank's developer portal
3. Configure the token using: `openbankingproject config set --token YOUR_TOKEN`

## Payment Services & Products

The API supports various payment services and products:

**Payment Services:**
- `payments` — Single payment
- `bulk-payments` — Bulk payment initiation
- `periodic-payments` — Recurring payments

**Common Payment Products (Switzerland):**
- `sepa-credit-transfers` — SEPA credit transfer
- `instant-sepa-credit-transfers` — Instant SEPA credit transfer
- `target-2-payments` — TARGET2 payments
- `cross-border-credit-transfers` — International transfers

Consult your bank's documentation for supported products.

## API Coverage

This CLI implements the core endpoints from the Swiss NextGen API v1.3.8:

**Account Information Service (AIS):**
- ✓ GET /v1/accounts
- ✓ GET /v1/accounts/{account-id}
- ✓ GET /v1/accounts/{account-id}/balances
- ✓ GET /v1/accounts/{account-id}/transactions
- ✓ GET /v1/accounts/{account-id}/transactions/{transactionId}

**Consents:**
- ✓ POST /v1/consents
- ✓ GET /v1/consents/{consentId}
- ✓ GET /v1/consents/{consentId}/status
- ✓ DELETE /v1/consents/{consentId}

**Payment Initiation Service (PIS):**
- ✓ POST /v1/{payment-service}/{payment-product}
- ✓ GET /v1/{payment-service}/{payment-product}/{paymentId}
- ✓ GET /v1/{payment-service}/{payment-product}/{paymentId}/status

**Confirmation of Funds Service (PIIS):**
- ✓ POST /v1/funds-confirmations

## Why CLI > MCP?

No server to run. No protocol overhead. Just install and go.

- **Simpler** — Just a binary you call directly
- **Composable** — Pipe to `jq`, `grep`, `awk`
- **Scriptable** — Works in cron jobs, CI/CD, shell scripts
- **Portable** — Works everywhere Node.js runs

## Development

```bash
# Clone the repository
git clone https://github.com/ktmcp-cli/openbankingproject.git
cd openbankingproject

# Install dependencies
npm install

# Run locally
node bin/openbankingproject.js --help
```

## License

MIT — Part of the [Kill The MCP](https://killthemcp.com) project.

## Resources

- [Open Banking Project Switzerland](https://www.openbankingproject.ch/)
- [Swiss NextGen API Documentation](https://github.com/openbankingproject-ch/obp-apis)
- [Berlin Group NextGenPSD2 Framework](https://www.berlin-group.org/nextgenpsd2-downloads)
- [API Specification](https://api.dev.openbankingproject.ch)
