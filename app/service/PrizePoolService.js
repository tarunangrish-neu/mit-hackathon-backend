import PrizePoolModel from '../model/PrizePool.js';
import * as LightningService from './LightningService.js';
import ArticlesModel from '../model/Article.js';
import { v4 as uuidv4 } from 'uuid';

// Initialize prize pool if it doesn't exist
export const initializePrizePool = async () => {
    try {
        console.log("Initializing prize pool...");
        const pool = await PrizePoolModel.findOne({ poolId: 'main' }).exec();
        
        if (!pool) {
            console.log("No prize pool found, creating new one");
            const newPool = new PrizePoolModel({
                poolId: 'main',
                totalFunds: 0,
                totalDonations: 0
            });
            await newPool.save();
            console.log('Prize pool initialized successfully');
            return newPool;
        }
        
        console.log(`Existing prize pool found: ${pool.totalFunds} sats, ${pool.totalDonations} donations`);
        return pool;
    } catch (error) {
        console.error('Error initializing prize pool:', error);
        throw error;
    }
};

// Create a donation request to the pool
export const createDonationRequest = async (amount) => {
    try {
        console.log(`Creating donation request for ${amount} sats`);
        
        // Validate amount
        if (!amount || amount <= 0) {
            throw new Error('Invalid donation amount');
        }
        
        // Create lightning invoice - FIXED using proper LightningService format
        const invoiceId = `donation-${uuidv4()}`;
        const invoice = await LightningService.createInvoice(
            invoiceId,  // Using articleId param position for our custom ID
            amount      // Amount in sats
        );
        
        console.log("Invoice created:", invoice);
        
        // Get the pool
        let pool = await PrizePoolModel.findOne({ poolId: 'main' }).exec();
        if (!pool) {
            pool = await initializePrizePool();
        }
        
        // Add donation record to history
        pool.donationHistory.push({
            timestamp: new Date(),
            amount,
            invoiceId: invoice.id,
            paymentRequest: invoice.request,
            status: 'pending'
        });
        
        await pool.save();
        
        return {
            invoiceId: invoice.id,
            paymentRequest: invoice.request,
            bolt11: invoice.bolt11, // Added bolt11 to the response
            amount,
            expiresAt: invoice.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day expiration
        };
    } catch (error) {
        console.error('Error creating donation request:', error);
        throw error;
    }
};

// Process a received donation payment
export const processDonationPayment = async (invoiceId) => {
    try {
        console.log(`Processing donation payment for invoice ${invoiceId}`);
        
        // Find the pool and the donation record
        const pool = await PrizePoolModel.findOne({ 
            poolId: 'main',
            'donationHistory.invoiceId': invoiceId
        }).exec();
        
        if (!pool) {
            throw new Error('Donation record not found');
        }
        
        // Find the specific donation in history
        const donationIndex = pool.donationHistory.findIndex(d => d.invoiceId === invoiceId);
        if (donationIndex === -1) {
            throw new Error('Donation record not found in history');
        }
        
        // Update donation status and pool total
        const donation = pool.donationHistory[donationIndex];
        
        // Verify payment with LN service - FIXED to use proper checkInvoice method
        const invoiceStatus = await LightningService.checkInvoice(invoiceId);
        
        if (invoiceStatus.isPaid) {
            pool.donationHistory[donationIndex].status = 'paid';
            pool.totalFunds += donation.amount;
            pool.totalDonations += 1;
            await pool.save();
            
            console.log(`Payment processed successfully. Pool now has ${pool.totalFunds} sats`);
            
            return {
                success: true,
                amount: donation.amount,
                poolTotal: pool.totalFunds
            };
        } else {
            console.log("Payment not verified yet");
            return {
                success: false,
                message: "Payment not received yet"
            };
        }
    } catch (error) {
        console.error('Error processing donation payment:', error);
        throw error;
    }
};

// Make a payout to the top article
export const payoutTopArticle = async () => {
    try {
        console.log("Initiating payout to top article");
        
        // Get the pool
        const pool = await PrizePoolModel.findOne({ poolId: 'main' }).exec();
        if (!pool || pool.totalFunds <= 0) {
            throw new Error('No funds available for payout');
        }
        
        console.log(`Available funds: ${pool.totalFunds} sats`);
        
        // First, get all published articles
        const publishedArticles = await ArticlesModel.find({ published: true }).exec();
        
        if (!publishedArticles || publishedArticles.length === 0) {
            throw new Error('No published articles available for payout');
        }
        
        console.log(`Found ${publishedArticles.length} published articles`);
        
        // Manually sort them by net votes (upvotes - downvotes)
        const sortedArticles = publishedArticles.sort((a, b) => {
            const aScore = a.upvotes - a.downvotes;
            const bScore = b.upvotes - b.downvotes;
            return bScore - aScore; // Descending order
        });
        
        const topArticle = sortedArticles[0];
        
        console.log(`Top article found: ${topArticle.title} (ID: ${topArticle.articleId})`);
        console.log(`Vote stats: ${topArticle.upvotes} upvotes, ${topArticle.downvotes} downvotes, net: ${topArticle.upvotes - topArticle.downvotes}`);
        
        // Check if article has a walletId
        if (!topArticle.walletId) {
            throw new Error(`Article ${topArticle.articleId} has no associated wallet for payment`);
        }
        
        // Determine payout amount (50% of pool)
        const payoutAmount = Math.floor(pool.totalFunds * 0.5);
        
        if (payoutAmount <= 0) {
            throw new Error('Payout amount too small');
        }
        
        console.log(`Preparing to pay ${payoutAmount} sats to wallet ${topArticle.walletId}`);
        
        try {
            // Attempt to make actual payment using LightningService
            // This is the best approach if the walletId is a valid Lightning address
            const paymentResult = await LightningService.payToWallet({
                walletId: topArticle.walletId,
                amount: payoutAmount,
                memo: `Prize payout for article: ${topArticle.title}`,
                id: `payout-${topArticle.articleId}`
            });
            
            console.log("Payment successful:", paymentResult);
            
            // Record the payout in history
            pool.payoutHistory.push({
                timestamp: new Date(),
                amount: payoutAmount,
                articleId: topArticle.articleId,
                recipientWalletId: topArticle.walletId,
                invoiceId: paymentResult.id
            });
            
            // Update pool balance
            pool.totalFunds -= payoutAmount;
            pool.lastPayout = new Date();
            await pool.save();
            
            return {
                success: true,
                paid: true,
                articleId: topArticle.articleId,
                title: topArticle.title,
                amount: payoutAmount,
                recipientWalletId: topArticle.walletId,
                remainingPool: pool.totalFunds,
                paymentId: paymentResult.id
            };
            
        } catch (paymentError) {
            console.error("Payment attempt failed:", paymentError);
            console.log("Falling back to recording payout without actual payment");
            
            // Record the intended payout even if payment failed
            const payoutId = `payout-${uuidv4()}`;
            
            pool.payoutHistory.push({
                timestamp: new Date(),
                amount: payoutAmount,
                articleId: topArticle.articleId,
                recipientWalletId: topArticle.walletId,
                invoiceId: payoutId
            });
            
            // Update pool balance
            pool.totalFunds -= payoutAmount;
            pool.lastPayout = new Date();
            await pool.save();
            
            return {
                success: true,
                paid: false, // Indicate payment wasn't processed
                articleId: topArticle.articleId,
                title: topArticle.title,
                amount: payoutAmount,
                recipientWalletId: topArticle.walletId,
                remainingPool: pool.totalFunds,
                error: paymentError.message
            };
        }
    } catch (error) {
        console.error('Error making payout to top article:', error);
        throw error;
    }
};

// Get pool stats
export const getPoolStats = async () => {
    try {
        console.log("Getting prize pool stats");
        const pool = await PrizePoolModel.findOne({ poolId: 'main' }).exec();
        
        if (!pool) {
            console.log("No prize pool found, initializing");
            const newPool = await initializePrizePool();
            return {
                totalFunds: newPool.totalFunds,
                totalDonations: newPool.totalDonations,
                lastPayout: null,
                recentPayouts: []
            };
        }
        
        console.log(`Pool stats: ${pool.totalFunds} sats, ${pool.totalDonations} donations`);
        
        return {
            totalFunds: pool.totalFunds,
            totalDonations: pool.totalDonations,
            lastPayout: pool.lastPayout,
            recentPayouts: pool.payoutHistory.slice(-5)  // Get last 5 payouts
        };
    } catch (error) {
        console.error('Error getting pool stats:', error);
        throw error;
    }
};

// For testing: Seed the prize pool with initial funds
export const seedPrizePool = async (amount = 50000) => {
    try {
        console.log(`Seeding prize pool with ${amount} sats`);
        let pool = await PrizePoolModel.findOne({ poolId: 'main' }).exec();
        
        if (!pool) {
            pool = await initializePrizePool();
        }
        
        // Add seed donation
        pool.donationHistory.push({
            timestamp: new Date(),
            amount,
            invoiceId: `seed-${uuidv4()}`,
            paymentRequest: 'seeded-manually',
            status: 'paid'
        });
        
        pool.totalFunds += amount;
        pool.totalDonations += 1;
        
        await pool.save();
        
        console.log(`Pool seeded successfully. Total: ${pool.totalFunds} sats`);
        
        return {
            success: true,
            totalFunds: pool.totalFunds,
            totalDonations: pool.totalDonations
        };
    } catch (error) {
        console.error('Error seeding prize pool:', error);
        throw error;
    }
};