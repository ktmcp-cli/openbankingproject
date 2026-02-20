# AGENT.md — Open Banking Project CLI for AI Agents

This document explains how to use the Open Banking Project CLI as an AI agent.

## Overview

The `openbankingproject` CLI provides access to the Swiss NextGen Banking API (PSD2-compliant). Use it for account information, payments, consents, and fund confirmations.

## Prerequisites

```bash
openbankingproject config set --token <oauth2-access-token>
```

You need an OAuth2 access token from your bank's TPP developer portal.

## All Commands

### Config

```bash
openbankingproject config set --token <token>
openbankingproject config set --base-url <url>
openbankingproject config show
```

### Accounts

```bash
# List accounts
openbankingproject accounts list
openbankingproject accounts list --with-balance --json

# Account details
openbankingproject accounts show <account-id>
openbankingproject accounts show <account-id> --with-balance --json

# Balances
openbankingproject accounts balances <account-id> --json

# Transactions
openbankingproject accounts transactions <account-id> --json
openbankingproject accounts transactions <account-id> --date-from 2024-01-01 --date-to 2024-01-31 --json
openbankingproject accounts transactions <account-id> --booking-status booked --json
```

### Consents

```bash
# Create consent
openbankingproject consents create --accounts CH9300762011623852957 --balances --transactions --json
openbankingproject consents create --all-accounts --balances --transactions --valid-until 2024-12-31 --json

# View consent
openbankingproject consents show <consent-id> --json
openbankingproject consents status <consent-id> --json

# Delete consent
openbankingproject consents delete <consent-id> --json
```

### Payments

```bash
# Initiate payment
openbankingproject payments initiate \
  --service payments \
  --product sepa-credit-transfers \
  --debtor-iban CH9300762011623852957 \
  --creditor-iban CH5604835012345678009 \
  --creditor-name "Recipient Name" \
  --amount 100.50 \
  --currency CHF \
  --reference "Payment description" \
  --json

# Payment status
openbankingproject payments status \
  --service payments \
  --product sepa-credit-transfers \
  --payment-id 12345 \
  --json

# Payment details
openbankingproject payments details \
  --service payments \
  --product sepa-credit-transfers \
  --payment-id 12345 \
  --json
```

### Funds Confirmation

```bash
openbankingproject check-funds \
  --iban CH9300762011623852957 \
  --amount 1000 \
  --currency CHF \
  --json
```

## Tips for Agents

1. **Always use `--json`** when parsing results programmatically
2. **Account IDs** are returned as `resourceId` in the accounts list
3. **Consent flow:**
   - Create consent → Get `consentId` and `scaRedirect` URL
   - User completes SCA (Strong Customer Authentication) at redirect URL
   - Check consent status → Should become `valid`
   - Use consent to access accounts
4. **Payment flow:**
   - Initiate payment → Get `paymentId` and `scaRedirect` URL
   - User completes SCA at redirect URL
   - Check payment status → Transitions from `RCVD` to `ACTC` to `ACSC`
5. **Date format:** Use `YYYY-MM-DD` for all date parameters
6. **IBAN format:** Swiss IBANs start with `CH` followed by 19 digits
7. **Booking status options:** `booked`, `pending`, `both`
8. **Common payment products:** `sepa-credit-transfers`, `instant-sepa-credit-transfers`
9. **API errors** include helpful messages in the `tppMessages` array

## Example Workflows

### Check account balance

```bash
# 1. List accounts
openbankingproject accounts list --json

# 2. Get specific account balance
openbankingproject accounts balances <account-id> --json
```

### View recent transactions

```bash
# Last 30 days of transactions
openbankingproject accounts transactions <account-id> \
  --date-from $(date -d '30 days ago' +%Y-%m-%d) \
  --date-to $(date +%Y-%m-%d) \
  --booking-status booked \
  --json
```

### Initiate and track payment

```bash
# 1. Initiate payment
openbankingproject payments initiate \
  --service payments \
  --product sepa-credit-transfers \
  --debtor-iban CH9300762011623852957 \
  --creditor-iban CH5604835012345678009 \
  --creditor-name "John Doe" \
  --amount 100 \
  --currency CHF \
  --json

# 2. Check status (extract paymentId from step 1)
openbankingproject payments status \
  --service payments \
  --product sepa-credit-transfers \
  --payment-id <payment-id> \
  --json
```

## Response Fields Reference

### Accounts List
```json
{
  "accounts": [
    {
      "resourceId": "account-identifier",
      "iban": "CH9300762011623852957",
      "currency": "CHF",
      "name": "Account Name",
      "product": "Current Account",
      "cashAccountType": "CACC"
    }
  ]
}
```

### Balances
```json
{
  "balances": [
    {
      "balanceAmount": {
        "amount": "1000.00",
        "currency": "CHF"
      },
      "balanceType": "interimAvailable",
      "referenceDate": "2024-01-15"
    }
  ]
}
```

### Transactions
```json
{
  "transactions": {
    "booked": [
      {
        "transactionId": "tx-123",
        "bookingDate": "2024-01-15",
        "valueDate": "2024-01-15",
        "transactionAmount": {
          "amount": "-50.00",
          "currency": "CHF"
        },
        "creditorName": "Merchant Name",
        "remittanceInformationUnstructured": "Payment description"
      }
    ]
  }
}
```
