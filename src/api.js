import axios from 'axios';
import { getConfig } from './config.js';

function getBaseURL() {
  return getConfig('baseUrl') || 'https://api.dev.openbankingproject.ch';
}

function getHeaders() {
  const token = getConfig('accessToken');
  if (!token) {
    throw new Error('Access token not configured. Run: openbankingproject config set --token YOUR_TOKEN');
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}

async function request(method, endpoint, data = null) {
  const baseURL = getBaseURL();

  try {
    const config = {
      method,
      url: `${baseURL}${endpoint}`,
      headers: getHeaders()
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      const msg = error.response.data?.tppMessages?.[0]?.text || error.response.data?.message || error.response.statusText;
      throw new Error(`API Error (${error.response.status}): ${msg}`);
    }
    throw new Error(`Request failed: ${error.message}`);
  }
}

// ============================================================
// Account Information Service (AIS)
// ============================================================

/**
 * Get list of accounts
 */
export async function getAccounts(withBalance = false) {
  const query = withBalance ? '?withBalance=true' : '';
  return await request('GET', `/v1/accounts${query}`);
}

/**
 * Get account details
 */
export async function getAccountDetails(accountId, withBalance = false) {
  const query = withBalance ? '?withBalance=true' : '';
  return await request('GET', `/v1/accounts/${accountId}${query}`);
}

/**
 * Get account balances
 */
export async function getAccountBalances(accountId) {
  return await request('GET', `/v1/accounts/${accountId}/balances`);
}

/**
 * Get account transactions
 */
export async function getAccountTransactions(accountId, options = {}) {
  const params = new URLSearchParams();
  if (options.dateFrom) params.append('dateFrom', options.dateFrom);
  if (options.dateTo) params.append('dateTo', options.dateTo);
  if (options.bookingStatus) params.append('bookingStatus', options.bookingStatus);

  const query = params.toString() ? `?${params.toString()}` : '';
  return await request('GET', `/v1/accounts/${accountId}/transactions${query}`);
}

/**
 * Get single transaction details
 */
export async function getTransactionDetails(accountId, transactionId) {
  return await request('GET', `/v1/accounts/${accountId}/transactions/${transactionId}`);
}

// ============================================================
// Consents
// ============================================================

/**
 * Create consent for account access
 */
export async function createConsent(consentData) {
  return await request('POST', '/v1/consents', consentData);
}

/**
 * Get consent details
 */
export async function getConsent(consentId) {
  return await request('GET', `/v1/consents/${consentId}`);
}

/**
 * Get consent status
 */
export async function getConsentStatus(consentId) {
  return await request('GET', `/v1/consents/${consentId}/status`);
}

/**
 * Delete consent
 */
export async function deleteConsent(consentId) {
  return await request('DELETE', `/v1/consents/${consentId}`);
}

// ============================================================
// Payment Initiation Service (PIS)
// ============================================================

/**
 * Initiate payment
 */
export async function initiatePayment(paymentService, paymentProduct, paymentData) {
  return await request('POST', `/v1/${paymentService}/${paymentProduct}`, paymentData);
}

/**
 * Get payment status
 */
export async function getPaymentStatus(paymentService, paymentProduct, paymentId) {
  return await request('GET', `/v1/${paymentService}/${paymentProduct}/${paymentId}/status`);
}

/**
 * Get payment details
 */
export async function getPaymentDetails(paymentService, paymentProduct, paymentId) {
  return await request('GET', `/v1/${paymentService}/${paymentProduct}/${paymentId}`);
}

// ============================================================
// Confirmation of Funds Service (PIIS)
// ============================================================

/**
 * Check funds availability
 */
export async function checkFunds(fundsCheckData) {
  return await request('POST', '/v1/funds-confirmations', fundsCheckData);
}
