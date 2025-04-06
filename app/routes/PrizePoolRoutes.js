import express from 'express';
import * as prizePoolController from '../controller/PrizePoolController.js';
import * as PrizePoolService from '../service/PrizePoolService.js'; // Add this import

const router = express.Router();

router.route('/')
    .get(prizePoolController.getPoolStats);

router.route('/donate')
    .post(prizePoolController.createDonation);

router.route('/donate/:invoiceId')
    .post(prizePoolController.processDonation);

router.route('/payout')
    .post(prizePoolController.makeTopArticlePayout);

// For development/testing only - FIXED IMPORT ISSUE
router.route('/seed')
    .post(async (req, res) => {
        try {
            const amount = req.body.amount || 50000;
            const result = await PrizePoolService.seedPrizePool(amount);
            res.status(200).json(result);
        } catch (error) {
            console.error("Error seeding pool:", error);
            res.status(500).json({ error: error.message });
        }
    });

export default router;