const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());
app.use(cors()); // Allows your GitHub Pages domain to talk to this backend

const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY; // Stored securely in host dashboard

app.post('/create-checkout', async (req, res) => {
  const { amountInCents, currency = 'ZAR', cancelUrl, successUrl } = req.body;

  try {
    const response = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${YOCO_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amountInCents, // e.g., R150.00 is 15000 cents
        currency: currency,
        successUrl: successUrl,
        cancelUrl: cancelUrl
      })
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
