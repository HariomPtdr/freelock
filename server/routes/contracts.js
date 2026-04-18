const express = require('express');
const router = express.Router();
const Contract = require('../models/Contract');
const Milestone = require('../models/Milestone');
const auth = require('../middleware/auth');
const isTestMode = require('../utils/isTestMode');
const { milestoneTransition } = require('../services/stateMachine');
const { initiateFreelancerPayout } = require('../services/releaseService');

// GET /api/contracts/my-contracts — client
router.get('/my-contracts', auth, async (req, res) => {
  try {
    const contracts = await Contract.find({ client: req.user.id })
      .populate('freelancer', 'name email rating')
      .populate('job', 'title')
      .sort({ createdAt: -1 });
    res.json(contracts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/contracts/my-work — freelancer
router.get('/my-work', auth, async (req, res) => {
  try {
    const contracts = await Contract.find({ freelancer: req.user.id })
      .populate('client', 'name email rating')
      .populate('job', 'title')
      .sort({ createdAt: -1 });
    res.json(contracts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/contracts/:id — with milestones
router.get('/:id', auth, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate('client', 'name email rating')
      .populate('freelancer', 'name email rating')
      .populate('job', 'title description');
    if (!contract) return res.status(404).json({ message: 'Not found' });

    const isParty = contract.client._id.toString() === req.user.id ||
      contract.freelancer._id.toString() === req.user.id ||
      req.user.role === 'admin';
    if (!isParty) return res.status(403).json({ message: 'Not your contract' });

    const milestones = await Milestone.find({ contract: contract._id }).sort({ milestoneNumber: 1 });
    res.json({ contract, milestones });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/contracts/:id/withdraw — client withdrawal with 50% rule
// Advance payment is always released to the freelancer on withdrawal (never refunded to client).
router.post('/:id/withdraw', auth, async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) return res.status(404).json({ message: 'Not found' });
    if (contract.client.toString() !== req.user.id) return res.status(403).json({ message: 'Clients only' });

    const milestones = await Milestone.find({ contract: contract._id });

    const advance = milestones.find(m => m.isAdvance);
    const regular = milestones.filter(m => !m.isAdvance);

    // Completion ratio is based on regular (phase) milestones only
    const total = regular.length;
    const approved = regular.filter(m => ['approved', 'released'].includes(m.status)).length;
    const inProgress = regular.filter(m => ['in_progress', 'submitted', 'review', 'funded'].includes(m.status)).length;
    const completionRatio = total > 0 ? (approved + inProgress * 0.5) / total : 0;
    const completionPercent = Math.round(completionRatio * 100);

    // Always release advance to freelancer on exit — it is never refunded to the client
    let advanceReleased = false;
    if (advance && advance.status === 'funded') {
      try {
        await milestoneTransition(advance._id, 'released');
        await initiateFreelancerPayout(advance);
        advanceReleased = true;
      } catch (e) {
        console.error('Failed to release advance on withdrawal:', e.message);
      }
    }

    if (completionRatio <= 0.5) {
      // Refund regular phase payments to client
      for (const m of regular) {
        if (['funded', 'in_progress'].includes(m.status)) {
          if (!isTestMode() && m.razorpayPaymentId && !m.razorpayPaymentId.startsWith('pay_test_')) {
            try {
              const Razorpay = require('razorpay');
              const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
              const refundAmt = m.clientTotal || m.amount;
              await razorpay.payments.refund(m.razorpayPaymentId, { amount: Math.round(refundAmt * 100) });
            } catch (e) {}
          }
          m.status = 'refunded';
          await m.save();
        }
      }
      contract.status = 'withdrawn';
      contract.withdrawnAt = new Date();
      await contract.save();
      return res.json({
        allowed: true,
        completionPercent,
        advanceReleased,
        message: advanceReleased
          ? 'Contract withdrawn. Phase funds refunded to you. Advance payment has been released to the freelancer.'
          : 'Contract withdrawn. All phase funds refunded.',
      });
    }

    const amountOwed = regular
      .filter(m => ['in_progress', 'submitted', 'review', 'funded'].includes(m.status))
      .reduce((sum, m) => sum + m.amount, 0);

    res.json({
      allowed: false,
      completionPercent,
      amountOwed,
      advanceReleased,
      message: `Work is ${completionPercent}% complete. You must pay ₹${amountOwed.toLocaleString()} before withdrawing.${advanceReleased ? ' The advance payment has been released to the freelancer.' : ''}`,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
