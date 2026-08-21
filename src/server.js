const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());
app.use(cors()); // Allows your GitHub Pages domain to talk to this backend

const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY; // Stored securely in Render dashboard

// 1. Create Checkout Session Endpoint
app.post('/create-checkout', async (req, res) => {
  const { amountInCents, currency = 'ZAR', cancelUrl, successUrl } = req.body;

  if (!amountInCents || amountInCents <= 0) {
    return res.status(400).json({ error: 'Invalid payment amount.' });
  }

  try {
    const response = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${YOCO_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amountInCents,
        currency: currency,
        successUrl: successUrl,
        cancelUrl: cancelUrl
      })
    });

    const data = await response.json();

    if (response.ok && data.redirectUrl) {
      return res.json({ redirectUrl: data.redirectUrl, checkoutId: data.id });
    } else {
      return res.status(response.status).json({ 
        error: data.message || 'Failed to create checkout session.' 
      });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// 2. Verify Payment Endpoint (Fixes false approval bug)
app.post('/verify-payment', async (req, res) => {
  const { checkoutId } = req.body;

  if (!checkoutId) {
    return res.status(400).json({ success: false, message: 'Missing checkout ID.' });
  }

  try {
    const response = await fetch(`https://payments.yoco.com/api/checkouts/${checkoutId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${YOCO_SECRET_KEY}`
      }
    });

    const data = await response.json();

    // Only return success if status is explicitly successful/paid
    if (response.ok && (data.status === 'successful' || data.status === 'paid')) {
      return res.json({ success: true, status: data.status });
    } else {
      return res.status(400).json({ 
        success: false, 
        status: data.status || 'failed', 
        message: 'Payment was declined, cancelled, or failed.' 
      });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
