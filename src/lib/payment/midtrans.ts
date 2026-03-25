// Midtrans Payment Gateway Integration
// Supports: Gopay, OVO, DANA, ShopeePay, Credit Card, Bank Transfer

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || '';
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || '';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const BASE_URL = IS_PRODUCTION 
  ? 'https://app.midtrans.com/snap/v1'
  : 'https://app.sandbox.midtrans.com/snap/v1';

// Create transaction token for Snap
export async function createTransaction(params: {
  orderId: string;
  amount: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  description?: string;
  items?: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
  callbacks?: {
    finish?: string;
    error?: string;
    pending?: string;
  };
}) {
  const auth = Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64');

  const payload = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.amount,
    },
    customer_details: {
      first_name: params.customerName || 'Player',
      email: params.customerEmail || 'player@idolmeta.id',
      phone: params.customerPhone || '',
    },
    item_details: params.items || [{
      id: 'REGISTRATION',
      price: params.amount,
      quantity: 1,
      name: params.description || 'Tournament Registration',
    }],
    callbacks: params.callbacks,
  };

  try {
    const response = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Midtrans] Error:', data);
      return { success: false, error: data.error_messages?.[0] || 'Payment creation failed' };
    }

    return {
      success: true,
      data: {
        token: data.token,
        redirect_url: data.redirect_url,
        order_id: params.orderId,
      },
    };
  } catch (error) {
    console.error('[Midtrans] Request failed:', error);
    return { success: false, error: 'Payment service unavailable' };
  }
}

// Get transaction status
export async function getTransactionStatus(orderId: string) {
  const auth = Buffer.from(MIDTRANS_SERVER_KEY + ':').toString('base64');
  const apiBase = IS_PRODUCTION 
    ? 'https://api.midtrans.com/v2'
    : 'https://api.sandbox.midtrans.com/v2';

  try {
    const response = await fetch(`${apiBase}/${orderId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    return {
      success: true,
      data: {
        order_id: data.order_id,
        status_code: data.status_code,
        transaction_status: data.transaction_status,
        fraud_status: data.fraud_status,
        payment_type: data.payment_type,
        gross_amount: data.gross_amount,
        transaction_time: data.transaction_time,
      },
    };
  } catch (error) {
    console.error('[Midtrans] Status check failed:', error);
    return { success: false, error: 'Failed to check status' };
  }
}

// Handle webhook notification
export async function handleWebhook(notification: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type: string;
  transaction_time: string;
}) {
  // Verify signature
  const serverKey = MIDTRANS_SERVER_KEY;
  const signature = await createSignatureKey(
    notification.order_id,
    notification.status_code,
    notification.gross_amount,
    serverKey
  );

  if (signature !== notification.signature_key) {
    console.error('[Midtrans] Invalid signature');
    return { success: false, error: 'Invalid signature' };
  }

  // Determine payment status
  let status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' = 'PENDING';

  if (notification.transaction_status === 'capture') {
    status = notification.fraud_status === 'accept' ? 'COMPLETED' : 'PENDING';
  } else if (notification.transaction_status === 'settlement') {
    status = 'COMPLETED';
  } else if (['cancel', 'deny', 'expire'].includes(notification.transaction_status)) {
    status = 'FAILED';
  } else if (notification.transaction_status === 'pending') {
    status = 'PENDING';
  }

  return {
    success: true,
    data: {
      orderId: notification.order_id,
      status,
      paymentType: notification.payment_type,
      amount: parseInt(notification.gross_amount),
      paidAt: notification.transaction_time,
    },
  };
}

// Create signature key for verification
async function createSignatureKey(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string
): Promise<string> {
  const crypto = await import('crypto');
  const input = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  return crypto.createHash('sha512').update(input).digest('hex');
}

// Get client key for frontend
export function getClientKey(): string {
  return MIDTRANS_CLIENT_KEY;
}

// Check if Midtrans is configured
export function isConfigured(): boolean {
  return !!MIDTRANS_SERVER_KEY && !!MIDTRANS_CLIENT_KEY;
}

const midtransService = {
  createTransaction,
  getTransactionStatus,
  handleWebhook,
  getClientKey,
  isConfigured,
};

export default midtransService;
