const express = require("express");
const Moralis = require("moralis").default;
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = 3001;
const axios = require("axios");


app.use(cors());
app.use(express.json());

const API_KEY_1INCH = 'OTs0qYu15O11VB1uToKCvmMS7ZIFEfZB'


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.get("/tokenPrice", async (req, res) => {
  const { query } = req
  const responseOne = await Moralis.EvmApi.token.getTokenPrice({
    // chain: "0x38", // mạng bnb 
    "chain": "0x1", // ETH
    // include: "percent_change",
    address: query.addressOne
  });
  console.log("🚀 ~ app.get ~ responseOne:", responseOne)

  const responseTwo = await Moralis.EvmApi.token.getTokenPrice({
    "chain": "0x1", // ETH
    // chain: "0x38",
    // include: "percent_change",
    address: query.addressTwo
  });
  const usdPrices = {
    tokenOne: responseOne.raw.usdPrice,
    tokenTwo: responseTwo.raw.usdPrice,
    ratio: responseOne.raw.usdPrice / responseTwo.raw.usdPrice
  }

  return res.status(200).json(usdPrices);
});

// test swaps
app.post("/swap", async (req, res) => {
  const { tokenOneAddress, tokenTwoAddress, tokenAmount, fromAddress, slippage } = req.body;

  try {
    // Đảm bảo không gửi quá 1 request mỗi giây
    await sleep(1000);

    // Kiểm tra allowance
    const allowance = await axios.get(`https://api.1inch.dev/swap/v6.0/1/approve/allowance`, {
      headers: {
        "Authorization": `Bearer ${API_KEY_1INCH}`
      },
      params: {
        tokenAddress: tokenOneAddress,
        walletAddress: fromAddress
      },
      paramsSerializer: { indexes: null }

    });


    if (allowance.data.allowance === "0") { // không được phê duyệt và dừng lại 
      // Đảm bảo không gửi quá 1 request mỗi giây
      await sleep(1000);
      const approve = await axios.get(`https://api.1inch.dev/swap/v6.0/1/approve/transaction`, {
        headers: {
          "Authorization": `Bearer ${API_KEY_1INCH}`
        },
        params: {
          tokenAddress: tokenOneAddress
        },
        paramsSerializer: { indexes: null }

      });
      return res.status(200).json({ approved: false, tx: approve.data });
    }

    // Gọi API swap
    const tx = await axios.get(`https://api.1inch.dev/swap/v6.0/1/swap`, {
      headers: {
        "Authorization": `Bearer ${API_KEY_1INCH}`
      },
      params: {
        src: tokenOneAddress,
        dst: tokenTwoAddress,
        amount: tokenAmount,
        from: fromAddress,
        slippage: slippage,
        origin: fromAddress
      }
    });
    console.log("🚀🚀🚀🚀🚀 tx:", tx)
    return res.status(200).json({ approved: true, tx: tx.data });
  } catch (error) {
    console.error("Error during swap:", error);
    return res.status(500).json({ error: "An error occurred during the swap." });
  }
});



Moralis.start({
  apiKey: process.env.MORALIS_KEY,
}).then(() => {
  app.listen(port, () => {
    console.log(`Listening for API Calls`);
  });
});
