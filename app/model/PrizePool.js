import mongoose from 'mongoose';
const { Schema } = mongoose;

const PrizePoolSchema = new Schema({
    poolId: {
        type: String,
        required: true,
        default: 'main',  // Default single pool for simplicity
        unique: true
    },
    totalFunds: {
        type: Number,
        required: true,
        default: 0
    },
    totalDonations: {
        type: Number,
        required: true,
        default: 0
    },
    lastPayout: {
        type: Date,
        default: null
    },
    payoutHistory: [{
        timestamp: Date,
        amount: Number,
        articleId: String,
        recipientWalletId: String,
        invoiceId: String
    }],
    donationHistory: [{
        timestamp: Date,
        amount: Number,
        invoiceId: String,
        paymentRequest: String,
        status: {
            type: String,
            enum: ['pending', 'paid', 'expired'],
            default: 'pending'
        }
    }]
});

const PrizePoolModel = mongoose.model('PrizePool', PrizePoolSchema);
export default PrizePoolModel;