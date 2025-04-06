import axios from 'axios';

// LNbits API configuration
const LNBITS_URL = "https://8e1f74c3-9bbc-4bba-a3e5-7070b20ee420-00-383ci964iphal.kirk.replit.dev";
const LNBITS_ADMIN_KEY = "da3d9b3efd24433f8cabea9e8bd32919";
const LNBITS_API_KEY = "320e65f5bea14a11a03b04e3a34e6393"

// Initialize axios instance for LNbits API
const lnbitsApi = axios.create({
    baseURL: LNBITS_URL,
    headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': LNBITS_ADMIN_KEY
    }
});

// Initialize Lightning connection
export const initLightningConnection = () => {
    try {
        // Simple test to verify API key works
        return lnbitsApi.get('/api/v1/wallet')
            .then(() => {
                console.log('Successfully connected to LNbits');
                return true;
            })
            .catch(error => {
                console.error('Error connecting to LNbits:', error.message);
                throw error;
            });
    } catch (error) {
        console.error('Error setting up LNbits connection:', error.message);
        throw error;
    }
};

// Create a Lightning invoice for an article submission
export const createInvoice = async (articleId, amount = 1000) => {
    try {
        const response = await lnbitsApi.post('/api/v1/payments', {
            out: false,
            amount: amount,
            memo: `Article submission: ${articleId}`,
        });

        console.log(response.data)

        return {
            bolt11: response.data.bolt11,
            id: response.data.payment_hash,
            request: response.data.payment_request,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hour expiry (default for LNbits)
            tokens: amount
        };
    } catch (error) {
        console.error('Error creating Lightning invoice:', error.response?.data || error.message);
        throw error;
    }
};

// Check if an invoice is paid
export const checkInvoice = async (invoiceId) => {
    try {
        const response = await lnbitsApi.get(`/api/v1/payments/${invoiceId}`);

        return {
            isPaid: response.data.paid,
            settleDate: response.data.paid ? new Date().toISOString() : null,
            preimage: response.data.preimage,
            details: response.data
        };
    } catch (error) {
        console.error('Error checking invoice status:', error.response?.data || error.message);
        throw error;
    }
};

// Get wallet balance
export const getWalletBalance = async () => {
    try {
        const response = await lnbitsApi.get('/api/v1/wallet');
        return {
            balance: response.data.balance / 1000, // Convert msat to sat
        };
    } catch (error) {
        console.error('Error getting wallet balance:', error.response?.data || error.message);
        throw error;
    }
};

// Create Wallet 
export const createWallet = async (name) => {
    try {
        const response = await lnbitsApi.post('/api/v1/wallet', {
            name: name,
        });

        return {
            walletId: response.data.id,
            name: response.data.name,
        };
    } catch (error) {
        console.error('Error creating wallet:', error.response?.data || error.message);
        throw error;
    }
};

// Make a payment to an external wallet/invoice
export const makePayment = async ({ destination, amount, memo, id }) => {
    try {
        console.log(`Attempting to pay ${amount} sats to ${destination}`);
        
        // For wallet-to-wallet transfers within LNbits, we need to create a payment
        const response = await lnbitsApi.post('/api/v1/payments', {
            out: true,
            bolt11: destination, // Assuming destination is a BOLT11 invoice
            amount: amount,
            memo: memo || `Payout: ${id}`
        });

        console.log("Payment response:", response.data);

        return {
            success: true,
            id: response.data.payment_hash,
            amount: amount,
            preimage: response.data.preimage,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error making Lightning payment:', error.response?.data || error.message);
        throw new Error(`Payment failed: ${error.message}`);
    }
};

// Alternative implementation if destination is a wallet ID, not an invoice
export const payToWallet = async ({ walletId, amount, memo, id }) => {
    try {
        console.log(`Attempting to pay ${amount} sats to wallet ${walletId}`);
        
        // First, we need to get the wallet's address
        const walletResponse = await axios.get(`${LNBITS_URL}/api/v1/wallet/${walletId}`);
        
        if (!walletResponse.data || !walletResponse.data.address) {
            throw new Error('Could not retrieve wallet information');
        }
        
        // Then make the payment
        const response = await lnbitsApi.post('/api/v1/payments', {
            out: true,
            amount: amount,
            memo: memo || `Payout: ${id}`,
            internal: true,
            destination_wallet: walletId
        });

        console.log("Payment response:", response.data);

        return {
            success: true,
            id: response.data.payment_hash,
            amount: amount,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error making wallet payment:', error.response?.data || error.message);
        throw new Error(`Wallet payment failed: ${error.message}`);
    }
};

// Check payment status
export const checkPayment = async (invoiceId) => {
    try {
        const invoiceStatus = await checkInvoice(invoiceId);
        return invoiceStatus.isPaid;
    } catch (error) {
        console.error('Error checking payment:', error);
        return false;
    }
};