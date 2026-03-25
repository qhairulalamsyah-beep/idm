// Xendit Payment Gateway Integration
// Supports: E-Wallet (OVO, DANA, ShopeePay, LinkAja), QRIS, Virtual Account, E-Money

const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY || '';
const XENDIT_PUBLIC_KEY = process.env.XENDIT_PUBLIC_KEY || '';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const BASE_URL = IS_PRODUCTION
  ? 'https://api.xendit.co'
  : 'https://api.xendit.co'; // Xendit uses same URL for sandbox with different keys

// Create E-Wallet charge (OVO, DANA, ShopeePay, etc.)
export async function createEWalletCharge(params: {
  referenceId: string;
  currency: string;
  amount: number;
  checkoutMethod: 'ONE_TIME_PAYMENT' | 'TOKENIZED_PAYMENT';
  channelCode: 'ID_OVO' | 'ID_DANA' | 'ID_SHOPEEPAY' | 'ID_LINKAJA';
  channelProperties: {
    mobileNumber?: string;
    successReturnUrl?: string;
    failureReturnUrl?: string;
    cancelReturnUrl?: string;
  };
  customer?: {
    referenceId: string;
    mobileNumber?: string;
    email?: string;
    givenNames?: string;
  };
  metadata?: Record<string, string>;
}) {
  const auth = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

  try {
    const response = await fetch(`${BASE_URL}/ewallets/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        reference_id: params.referenceId,
        currency: params.currency || 'IDR',
        amount: params.amount,
        checkout_method: params.checkoutMethod || 'ONE_TIME_PAYMENT',
        channel_code: params.channelCode,
        channel_properties: params.channelProperties,
        customer: params.customer,
        metadata: params.metadata,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Xendit] Error:', data);
      return { success: false, error: data.message || 'E-Wallet charge failed' };
    }

    return {
      success: true,
      data: {
        id: data.id,
        referenceId: data.reference_id,
        status: data.status,
        channelCode: data.channel_code,
        actions: data.actions, // Contains desktop_web_checkout_url, mobile_web_checkout_url, etc.
        qrString: data.qr_string,
      },
    };
  } catch (error) {
    console.error('[Xendit] Request failed:', error);
    return { success: false, error: 'Payment service unavailable' };
  }
}

// Create QRIS payment
export async function createQRCode(params: {
  referenceId: string;
  type: 'DYNAMIC' | 'STATIC';
  currency?: string;
  amount: number;
  expiresAt?: string;
  callbackUrl?: string;
}) {
  const auth = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

  try {
    const response = await fetch(`${BASE_URL}/qr_codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        reference_id: params.referenceId,
        type: params.type || 'DYNAMIC',
        currency: params.currency || 'IDR',
        amount: params.amount,
        callback_url: params.callbackUrl,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Xendit] QR Error:', data);
      return { success: false, error: data.message || 'QR creation failed' };
    }

    return {
      success: true,
      data: {
        id: data.id,
        referenceId: data.reference_id,
        qrString: data.qr_string,
        qrImageUrl: data.qr_image_url, // SVG image URL
        amount: data.amount,
        status: data.status,
        expiresAt: data.expires_at,
      },
    };
  } catch (error) {
    console.error('[Xendit] QR Request failed:', error);
    return { success: false, error: 'QR service unavailable' };
  }
}

// Create Virtual Account
export async function createVirtualAccount(params: {
  externalId: string;
  bankCode: string; // BCA, BNI, BRI, MANDIRI, etc.
  name: string;
  expectedAmount: number;
  expirationDate?: string;
  isClosed?: boolean;
  isSingleUse?: boolean;
  description?: string;
}) {
  const auth = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

  try {
    const response = await fetch(`${BASE_URL}/callback_virtual_accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        external_id: params.externalId,
        bank_code: params.bankCode,
        name: params.name,
        expected_amount: params.expectedAmount,
        expiration_date: params.expirationDate,
        is_closed: params.isClosed ?? true,
        is_single_use: params.isSingleUse ?? true,
        description: params.description,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Xendit] VA Error:', data);
      return { success: false, error: data.message || 'VA creation failed' };
    }

    return {
      success: true,
      data: {
        id: data.id,
        externalId: data.external_id,
        accountId: data.account_number,
        bankCode: data.bank_code,
        name: data.name,
        amount: data.expected_amount,
        expirationDate: data.expiration_date,
      },
    };
  } catch (error) {
    console.error('[Xendit] VA Request failed:', error);
    return { success: false, error: 'VA service unavailable' };
  }
}

// Get payment status
export async function getPaymentStatus(paymentId: string, type: 'ewallet' | 'qr' | 'va' = 'ewallet') {
  const auth = Buffer.from(XENDIT_SECRET_KEY + ':').toString('base64');

  let endpoint = '';
  switch (type) {
    case 'ewallet':
      endpoint = `${BASE_URL}/ewallets/charges/${paymentId}`;
      break;
    case 'qr':
      endpoint = `${BASE_URL}/qr_codes/${paymentId}`;
      break;
    case 'va':
      endpoint = `${BASE_URL}/callback_virtual_accounts/${paymentId}`;
      break;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    const data = await response.json();

    return {
      success: true,
      data: {
        id: data.id,
        status: data.status,
        amount: data.amount || data.expected_amount,
      },
    };
  } catch (error) {
    console.error('[Xendit] Status check failed:', error);
    return { success: false, error: 'Failed to check status' };
  }
}

// Handle webhook callback
export async function handleCallback(callback: {
  event: string;
  business_id: string;
  created: string;
  data: Record<string, unknown>;
}) {
  const eventType = callback.event;

  let status: 'PENDING' | 'COMPLETED' | 'FAILED' = 'PENDING';

  switch (eventType) {
    case 'ewallet.payment.completed':
    case 'qr.payment.completed':
    case 'virtual_account.paid':
      status = 'COMPLETED';
      break;
    case 'ewallet.payment.expired':
    case 'qr.payment.expired':
    case 'virtual_account.expired':
      status = 'FAILED';
      break;
    default:
      status = 'PENDING';
  }

  const data = callback.data as Record<string, unknown>;

  return {
    success: true,
    data: {
      referenceId: data.reference_id || data.external_id || data.id,
      status,
      amount: data.amount || data.payment_amount,
      paymentType: eventType.split('.')[0],
      paidAt: data.created || callback.created,
    },
  };
}

// Check if Xendit is configured
export function isConfigured(): boolean {
  return !!XENDIT_SECRET_KEY;
}

// Get available banks for VA
export const AVAILABLE_BANKS = [
  { code: 'BCA', name: 'Bank Central Asia (BCA)' },
  { code: 'BNI', name: 'Bank Negara Indonesia (BNI)' },
  { code: 'BRI', name: 'Bank Rakyat Indonesia (BRI)' },
  { code: 'MANDIRI', name: 'Bank Mandiri' },
  { code: 'PERMATA', name: 'Bank Permata' },
  { code: 'BSI', name: 'Bank Syariah Indonesia (BSI)' },
  { code: 'CIMB', name: 'CIMB Niaga' },
  { code: 'SAHABAT_SAMPOERNA', name: 'Bank Sahabat Sampoerna' },
];

// Get available e-wallets
export const AVAILABLE_EWALLETS = [
  { code: 'ID_OVO', name: 'OVO', icon: '💳' },
  { code: 'ID_DANA', name: 'DANA', icon: '💰' },
  { code: 'ID_SHOPEEPAY', name: 'ShopeePay', icon: '🛒' },
  { code: 'ID_LINKAJA', name: 'LinkAja', icon: '📱' },
];

const xenditService = {
  createEWalletCharge,
  createQRCode,
  createVirtualAccount,
  getPaymentStatus,
  handleCallback,
  isConfigured,
  AVAILABLE_BANKS,
  AVAILABLE_EWALLETS,
};

export default xenditService;
