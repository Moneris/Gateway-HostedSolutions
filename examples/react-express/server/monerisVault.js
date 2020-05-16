const axios = require('axios');
const express = require('express');
const cc = require('coupon-code');
const xml2js = require('xml2js');
const config = require('../config/moneris.json');

const url = config.gateway;

const parseString = xml2js.parseString;
const router = express.Router();

const requestMoneris = async (xml) => {
  const posted = await axios.post(url, xml, {
    headers: {'Content-Type': 'text/xml'},
  });
  if (posted.status < 200 || posted.status > 299) {
    return res.json({
      success: false,
      error: posted,
    });
  }

  const {data} = posted || {};

  const {response, error} = await new Promise((done) =>
      parseString(data, (error, result) => {
        if (error) return done({error});
        done(result);
      })
  );

  if (error) {
    return {
      success: false,
      error,
    };
  }

  const [receipt] =
      response.receipt && response.receipt.map ? response.receipt : response.receipt ? [response.receipt] : [];
  if (!receipt) {
    console.error({response});
    return {
      success: false,
      response,
      error: 'no receipt',
    };
  }
  if (
      receipt.ResSuccess === 'false' ||
      (receipt.ResSuccess && receipt.ResSuccess.map && receipt.ResSuccess[0] === 'false') ||
      (receipt.Complete && receipt.Complete.map && receipt.Complete[0] === 'false')
  ) {
    return {
      success: false,
      response,
      error: receipt.Message[0] || receipt.Message || 'Failed',
    };
  }

  return {
    success: true,
    receipt,
  };
};

const extractReceipt = (result) => {
  const {receipt} = result;
  const [receiptId] = receipt.ReceiptId && receipt.ReceiptId.map ? receipt.ReceiptId : [receipt.ReceiptId];
  const [referenceNum] =
      receipt.ReferenceNum && receipt.ReferenceNum.map ? receipt.ReferenceNum : [receipt.ReferenceNum];
  return {receiptId, referenceNum};
};

const handleReceipt = ({receiptId, referenceNum, ...rest}) => {
  console.dir({receiptId, referenceNum, ...rest});
  // TODO
};

router.post('/checkout_action', async (req, res) => {
  console.log('Checkout', req.body);
  const {
    body: {email, token, ...rest},
  } = req;
  const orderPaymentId = cc.generate({parts: 4});

  const orderAmount = 1.0; // TODO calculate from cart

  const xml = `<?xml version="1.0"?>
<request>
    <store_id>${config.store_id}</store_id>
    <api_token>${config.api_token}</api_token>
    <res_purchase_cc>
        <data_key>${token}</data_key>
        <crypt_type>T</crypt_type>
        <order_id>${orderPaymentId}</order_id>
        <amount>${orderAmount}</amount>
        <cust_id>${email}</cust_id>
    </res_purchase_cc>
</request>`;
  const result = await requestMoneris(xml);
  if (!result.success) {
    return res.status(500).json({...result, xml});
  }
  const {receiptId, referenceNum} = extractReceipt(result);

  handleReceipt({receiptId, referenceNum, email, ...rest});

  res.json({
    email,
    success: true,
    orderId: `${orderPaymentId}`,
    transactionId: `${orderPaymentId}`,
    paymentApproved: true,
  });
});

module.exports = router;
