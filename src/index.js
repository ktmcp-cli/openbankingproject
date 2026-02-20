import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, setConfig, isConfigured } from './config.js';
import {
  getAccounts,
  getAccountDetails,
  getAccountBalances,
  getAccountTransactions,
  getTransactionDetails,
  createConsent,
  getConsent,
  getConsentStatus,
  deleteConsent,
  initiatePayment,
  getPaymentStatus,
  getPaymentDetails,
  checkFunds
} from './api.js';

const program = new Command();

// ============================================================
// Helpers
// ============================================================

function printSuccess(message) {
  console.log(chalk.green('✓') + ' ' + message);
}

function printError(message) {
  console.error(chalk.red('✗') + ' ' + message);
}

function printTable(data, columns) {
  if (!data || data.length === 0) {
    console.log(chalk.yellow('No results found.'));
    return;
  }

  const widths = {};
  columns.forEach(col => {
    widths[col.key] = col.label.length;
    data.forEach(row => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      if (val.length > widths[col.key]) widths[col.key] = val.length;
    });
    widths[col.key] = Math.min(widths[col.key], 50);
  });

  const header = columns.map(col => col.label.padEnd(widths[col.key])).join('  ');
  console.log(chalk.bold(chalk.cyan(header)));
  console.log(chalk.dim('─'.repeat(header.length)));

  data.forEach(row => {
    const line = columns.map(col => {
      const val = String(col.format ? col.format(row[col.key], row) : (row[col.key] ?? ''));
      return val.substring(0, widths[col.key]).padEnd(widths[col.key]);
    }).join('  ');
    console.log(line);
  });

  console.log(chalk.dim(`\n${data.length} result(s)`));
}

function printJson(data) {
  console.log(JSON.stringify(data, null, 2));
}

async function withSpinner(message, fn) {
  const spinner = ora(message).start();
  try {
    const result = await fn();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

function requireAuth() {
  if (!isConfigured()) {
    printError('Access token not configured.');
    console.log('\nRun the following to configure:');
    console.log(chalk.cyan('  openbankingproject config set --token YOUR_ACCESS_TOKEN'));
    console.log('\nGet your OAuth2 access token from your bank\'s developer portal.');
    process.exit(1);
  }
}

// ============================================================
// Program metadata
// ============================================================

program
  .name('openbankingproject')
  .description(chalk.bold('Open Banking Project CLI') + ' - Swiss NextGen Banking API')
  .version('1.0.0');

// ============================================================
// CONFIG
// ============================================================

const configCmd = program.command('config').description('Manage CLI configuration');

configCmd
  .command('set')
  .description('Set configuration values')
  .option('--token <token>', 'OAuth2 access token')
  .option('--base-url <url>', 'API base URL (default: https://api.dev.openbankingproject.ch)')
  .action((options) => {
    if (options.token) {
      setConfig('accessToken', options.token);
      printSuccess('Access token set');
    }
    if (options.baseUrl) {
      setConfig('baseUrl', options.baseUrl);
      printSuccess('Base URL set to: ' + options.baseUrl);
    }
    if (!options.token && !options.baseUrl) {
      printError('No options provided. Use --token or --base-url');
    }
  });

configCmd
  .command('show')
  .description('Show current configuration')
  .action(() => {
    const token = getConfig('accessToken');
    const baseUrl = getConfig('baseUrl');
    console.log(chalk.bold('\nOpen Banking Project CLI Configuration\n'));
    console.log('Access Token: ', token ? chalk.green(token.substring(0, 10) + '...' + token.slice(-4)) : chalk.red('not set'));
    console.log('Base URL:     ', baseUrl || chalk.dim('(default)'));
    console.log('');
  });

// ============================================================
// ACCOUNTS
// ============================================================

const accountsCmd = program.command('accounts').description('Manage accounts');

accountsCmd
  .command('list')
  .description('List all accessible accounts')
  .option('--with-balance', 'Include balance information')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();

    try {
      const data = await withSpinner('Fetching accounts...', () =>
        getAccounts(options.withBalance)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      const accounts = data.accounts || [];

      console.log(chalk.bold('\nAccounts\n'));

      const tableData = accounts.map(acc => ({
        resourceId: acc.resourceId || 'N/A',
        iban: acc.iban || 'N/A',
        currency: acc.currency || 'N/A',
        name: acc.name || acc.product || 'N/A',
        cashAccountType: acc.cashAccountType || 'N/A'
      }));

      printTable(tableData, [
        { key: 'resourceId', label: 'Resource ID' },
        { key: 'iban', label: 'IBAN' },
        { key: 'currency', label: 'Currency' },
        { key: 'name', label: 'Name/Product' },
        { key: 'cashAccountType', label: 'Type' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

accountsCmd
  .command('show <account-id>')
  .description('Get details for a specific account')
  .option('--with-balance', 'Include balance information')
  .option('--json', 'Output as JSON')
  .action(async (accountId, options) => {
    requireAuth();

    try {
      const data = await withSpinner(`Fetching account ${accountId}...`, () =>
        getAccountDetails(accountId, options.withBalance)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      const acc = data.account || data;
      console.log(chalk.bold('\nAccount Details\n'));
      console.log('Resource ID:       ', chalk.cyan(acc.resourceId || 'N/A'));
      console.log('IBAN:              ', acc.iban || 'N/A');
      console.log('Currency:          ', acc.currency || 'N/A');
      console.log('Name:              ', acc.name || 'N/A');
      console.log('Product:           ', acc.product || 'N/A');
      console.log('Cash Account Type: ', acc.cashAccountType || 'N/A');
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

accountsCmd
  .command('balances <account-id>')
  .description('Get balances for an account')
  .option('--json', 'Output as JSON')
  .action(async (accountId, options) => {
    requireAuth();

    try {
      const data = await withSpinner(`Fetching balances for ${accountId}...`, () =>
        getAccountBalances(accountId)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      const balances = data.balances || [];

      console.log(chalk.bold(`\nBalances for ${accountId}\n`));

      balances.forEach(bal => {
        console.log(`${chalk.cyan(bal.balanceType || 'Balance')}:`);
        console.log(`  Amount:        ${chalk.green(bal.balanceAmount?.amount || 'N/A')} ${bal.balanceAmount?.currency || ''}`);
        console.log(`  Reference Date: ${bal.referenceDate || 'N/A'}`);
        console.log('');
      });
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

accountsCmd
  .command('transactions <account-id>')
  .description('Get transactions for an account')
  .option('--date-from <date>', 'Start date (YYYY-MM-DD)')
  .option('--date-to <date>', 'End date (YYYY-MM-DD)')
  .option('--booking-status <status>', 'Booking status (booked, pending, both)')
  .option('--json', 'Output as JSON')
  .action(async (accountId, options) => {
    requireAuth();

    try {
      const data = await withSpinner(`Fetching transactions for ${accountId}...`, () =>
        getAccountTransactions(accountId, {
          dateFrom: options.dateFrom,
          dateTo: options.dateTo,
          bookingStatus: options.bookingStatus
        })
      );

      if (options.json) {
        printJson(data);
        return;
      }

      const transactions = data.transactions?.booked || data.transactions?.pending || [];

      console.log(chalk.bold(`\nTransactions for ${accountId}\n`));

      const tableData = transactions.map(tx => ({
        transactionId: tx.transactionId || tx.entryReference || 'N/A',
        bookingDate: tx.bookingDate || 'N/A',
        amount: `${tx.transactionAmount?.amount || 'N/A'} ${tx.transactionAmount?.currency || ''}`,
        creditorName: tx.creditorName || tx.debtorName || 'N/A',
        remittanceInfo: tx.remittanceInformationUnstructured || 'N/A'
      }));

      printTable(tableData, [
        { key: 'transactionId', label: 'Transaction ID' },
        { key: 'bookingDate', label: 'Date' },
        { key: 'amount', label: 'Amount' },
        { key: 'creditorName', label: 'Counterparty' },
        { key: 'remittanceInfo', label: 'Description' }
      ]);
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// CONSENTS
// ============================================================

const consentsCmd = program.command('consents').description('Manage consents');

consentsCmd
  .command('create')
  .description('Create a new consent for account access')
  .option('--accounts <list>', 'Comma-separated list of IBANs')
  .option('--all-accounts', 'Access all available accounts')
  .option('--balances', 'Include balance access')
  .option('--transactions', 'Include transaction access')
  .option('--valid-until <date>', 'Valid until date (YYYY-MM-DD)')
  .option('--frequency <n>', 'Frequency per day (default: 4)')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();

    const consentData = {
      access: {},
      recurringIndicator: true,
      validUntil: options.validUntil || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      frequencyPerDay: parseInt(options.frequency) || 4
    };

    if (options.allAccounts) {
      if (options.balances) consentData.access.allPsd2 = 'allAccounts';
      if (options.transactions) consentData.access.allPsd2 = 'allAccounts';
      if (!options.balances && !options.transactions) {
        consentData.access.allPsd2 = 'allAccounts';
      }
    } else if (options.accounts) {
      const accountList = options.accounts.split(',').map(iban => ({ iban: iban.trim() }));
      if (options.balances) consentData.access.balances = accountList;
      if (options.transactions) consentData.access.transactions = accountList;
    } else {
      printError('Please specify --accounts or --all-accounts');
      process.exit(1);
    }

    try {
      const data = await withSpinner('Creating consent...', () => createConsent(consentData));

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold('\nConsent Created\n'));
      console.log('Consent ID:     ', chalk.cyan(data.consentId || 'N/A'));
      console.log('Consent Status: ', data.consentStatus || 'N/A');
      console.log('');

      if (data._links?.scaRedirect?.href) {
        console.log(chalk.yellow('Please complete authorization:'));
        console.log(data._links.scaRedirect.href);
        console.log('');
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

consentsCmd
  .command('show <consent-id>')
  .description('Get consent details')
  .option('--json', 'Output as JSON')
  .action(async (consentId, options) => {
    requireAuth();

    try {
      const data = await withSpinner(`Fetching consent ${consentId}...`, () =>
        getConsent(consentId)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold('\nConsent Details\n'));
      console.log('Consent ID:          ', chalk.cyan(consentId));
      console.log('Consent Status:      ', data.consentStatus || 'N/A');
      console.log('Valid Until:         ', data.validUntil || 'N/A');
      console.log('Frequency Per Day:   ', data.frequencyPerDay || 'N/A');
      console.log('Recurring Indicator: ', data.recurringIndicator ? 'Yes' : 'No');
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

consentsCmd
  .command('status <consent-id>')
  .description('Get consent status')
  .option('--json', 'Output as JSON')
  .action(async (consentId, options) => {
    requireAuth();

    try {
      const data = await withSpinner(`Fetching consent status...`, () =>
        getConsentStatus(consentId)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold('\nConsent Status\n'));
      console.log('Status: ', chalk.cyan(data.consentStatus || 'N/A'));
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

consentsCmd
  .command('delete <consent-id>')
  .description('Delete a consent')
  .option('--json', 'Output as JSON')
  .action(async (consentId, options) => {
    requireAuth();

    try {
      const data = await withSpinner(`Deleting consent ${consentId}...`, () =>
        deleteConsent(consentId)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      printSuccess('Consent deleted successfully');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// PAYMENTS
// ============================================================

const paymentsCmd = program.command('payments').description('Payment operations');

paymentsCmd
  .command('initiate')
  .description('Initiate a payment')
  .requiredOption('--service <type>', 'Payment service (payments, bulk-payments, periodic-payments)')
  .requiredOption('--product <type>', 'Payment product (e.g., sepa-credit-transfers, instant-sepa-credit-transfers)')
  .requiredOption('--debtor-iban <iban>', 'Debtor IBAN')
  .requiredOption('--creditor-iban <iban>', 'Creditor IBAN')
  .requiredOption('--creditor-name <name>', 'Creditor name')
  .requiredOption('--amount <amount>', 'Amount')
  .requiredOption('--currency <currency>', 'Currency (e.g., CHF, EUR)')
  .option('--reference <ref>', 'Payment reference/description')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();

    const paymentData = {
      debtorAccount: {
        iban: options.debtorIban
      },
      instructedAmount: {
        amount: options.amount,
        currency: options.currency
      },
      creditorAccount: {
        iban: options.creditorIban
      },
      creditorName: options.creditorName
    };

    if (options.reference) {
      paymentData.remittanceInformationUnstructured = options.reference;
    }

    try {
      const data = await withSpinner('Initiating payment...', () =>
        initiatePayment(options.service, options.product, paymentData)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold('\nPayment Initiated\n'));
      console.log('Payment ID:     ', chalk.cyan(data.paymentId || 'N/A'));
      console.log('Transaction Status: ', data.transactionStatus || 'N/A');
      console.log('');

      if (data._links?.scaRedirect?.href) {
        console.log(chalk.yellow('Please complete authorization:'));
        console.log(data._links.scaRedirect.href);
        console.log('');
      }
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

paymentsCmd
  .command('status')
  .description('Get payment status')
  .requiredOption('--service <type>', 'Payment service')
  .requiredOption('--product <type>', 'Payment product')
  .requiredOption('--payment-id <id>', 'Payment ID')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();

    try {
      const data = await withSpinner('Fetching payment status...', () =>
        getPaymentStatus(options.service, options.product, options.paymentId)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold('\nPayment Status\n'));
      console.log('Transaction Status: ', chalk.cyan(data.transactionStatus || 'N/A'));
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

paymentsCmd
  .command('details')
  .description('Get payment details')
  .requiredOption('--service <type>', 'Payment service')
  .requiredOption('--product <type>', 'Payment product')
  .requiredOption('--payment-id <id>', 'Payment ID')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();

    try {
      const data = await withSpinner('Fetching payment details...', () =>
        getPaymentDetails(options.service, options.product, options.paymentId)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      const payment = data;
      console.log(chalk.bold('\nPayment Details\n'));
      console.log('Debtor IBAN:    ', payment.debtorAccount?.iban || 'N/A');
      console.log('Creditor IBAN:  ', payment.creditorAccount?.iban || 'N/A');
      console.log('Creditor Name:  ', payment.creditorName || 'N/A');
      console.log('Amount:         ', `${payment.instructedAmount?.amount || 'N/A'} ${payment.instructedAmount?.currency || ''}`);
      console.log('Reference:      ', payment.remittanceInformationUnstructured || 'N/A');
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// FUNDS
// ============================================================

program
  .command('check-funds')
  .description('Check if funds are available')
  .requiredOption('--iban <iban>', 'Account IBAN')
  .requiredOption('--amount <amount>', 'Amount to check')
  .requiredOption('--currency <currency>', 'Currency')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    requireAuth();

    const fundsCheckData = {
      account: {
        iban: options.iban
      },
      instructedAmount: {
        amount: options.amount,
        currency: options.currency
      }
    };

    try {
      const data = await withSpinner('Checking funds availability...', () =>
        checkFunds(fundsCheckData)
      );

      if (options.json) {
        printJson(data);
        return;
      }

      console.log(chalk.bold('\nFunds Check\n'));
      console.log('Funds Available: ', data.fundsAvailable ? chalk.green('Yes') : chalk.red('No'));
      console.log('');
    } catch (error) {
      printError(error.message);
      process.exit(1);
    }
  });

// ============================================================
// Parse
// ============================================================

program.parse(process.argv);

if (process.argv.length <= 2) {
  program.help();
}
