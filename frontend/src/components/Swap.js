import React, { useState, useEffect } from "react";
import { Input, Popover, Radio, Modal, message } from "antd";
import {
  ArrowDownOutlined,
  DownOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import tokenList from "../tokenList.json";
import axios from "axios";
import TokenList from '../tokenList.json'
import { useSendTransaction, useWaitForTransaction } from "wagmi";


export default function Swap(props) {
  const { address, isConnected } = props
  const [messageApi, contextHolder] = message.useMessage();
  const [slippage, setSlippage] = useState(2.5)
  const [tokenOneAmount, setTokenOneAmount] = useState(null)
  const [tokenTwoAmount, setTokenTwoAmount] = useState(null)
  const [tokens, setTokens] = useState([]);
  console.log("🚀 ~ Swap ~ tokens:", tokens)
  const [tokenOne, setTokenOne] = useState(TokenList[0])
  const [tokenTwo, setTokenTwo] = useState(TokenList[1])
  const [isOpen, setIsOpen] = useState(false)
  const [changeToken, setChangeToken] = useState(1)
  const [prices, setPrices] = useState(null)
  console.log("🚀 ~ Swap ~ prices:", prices)

  // search
  const [searchInput, setSearchInput] = useState("");
  const [filteredTokens, setFilteredTokens] = useState(tokenList);
  // search

  const [txDetail, setTxDetail] = useState({
    to: null,
    data: null,
    value: null,
  })
  const { data, sendTransaction } = useSendTransaction({
    request: {
      from: address,
      to: String(txDetail.to),
      data: String(txDetail.data),
      value: String(txDetail.value)
    }
  })

  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  const handleSlippageChange = (e) => {
    console.log("🚀 ~ handleSlippageChange ~ e:", e)
    setSlippage(e.target.value)
  }
  const changeAmount = (e) => {
    console.log("🚀 ~ changeAmount ~ e:", e.target.value)
    setTokenOneAmount(e.target.value)
    if (e.target.value && prices) {
      setTokenTwoAmount((e.target.value * prices.ratio).toFixed(7))
    } else {
      setTokenTwoAmount(null)
    }
  }
  const switchTokens = () => {
    setPrices(null);
    setTokenOneAmount(null)
    setTokenTwoAmount(null)
    const one = tokenOne
    const two = tokenTwo
    setTokenOne(two)
    setTokenTwo(one)
    fetchPrices(two.address, one.address)

  }
  const openModal = (asset) => {
    setChangeToken(asset)
    setIsOpen(true)
  }

  const modifiToken = (i) => {
    setPrices(null);
    setTokenOneAmount(null);
    setTokenTwoAmount(null);

    // Kiểm tra xem người dùng đang thay đổi token nào (tokenOne hoặc tokenTwo)
    if (changeToken === 1) {
      setTokenOne(filteredTokens[i]); // Cập nhật tokenOne nếu đang thay đổi tokenOne
      fetchPrices(filteredTokens[i].address, tokenTwo.address); // Lấy giá trị token mới
    } else {
      setTokenTwo(filteredTokens[i]); // Cập nhật tokenTwo nếu đang thay đổi tokenTwo
      fetchPrices(tokenOne.address, filteredTokens[i].address); // Lấy giá trị token mới
    }

    setIsOpen(false); // Đóng modal sau khi chọn token
  };


  const fetchListToken = async () => {
    const res = await axios.get("https://tokens.coingecko.com/uniswap/all.json")

    setTokens(res.data.tokens);
  }



  const fetchPrices = async (one, two) => {
    const res = await axios.get(`http://localhost:3001/tokenPrice`, {
      params: {
        addressOne: one,
        addressTwo: two
      }
    })
    // console.log("🚀 ~ fetchPrices ~ res:", res.data)
    setPrices(res.data)
  }
  // Gọi backend để thực hiện swap
  async function fetchDexSwap() {
    try {
      const response = await axios.post("http://localhost:3001/swap", {
        tokenOneAddress: tokenOne.address,
        tokenTwoAddress: tokenTwo.address,
        tokenAmount: tokenOneAmount.padEnd(tokenOne.decimals + tokenOneAmount.length, '0'),
        fromAddress: address,
        slippage: slippage
      });
      console.log("🚀 ~ fetchDexSwap ~ response:", response)

      if (!response.data.approved) {
        setTxDetail(response.data.tx);
        console.log("Not approved");
        return;
      }

      const decimals = Number(`1E${tokenTwo.decimals}`);
      setTokenTwoAmount((Number(response.data.tx.data.toTokenAmount) / decimals).toFixed(2));
      setTxDetail(response.data.tx);
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.error("Rate limit exceeded. Please wait before trying again.");
        // Có thể thêm logic để retry yêu cầu sau một khoảng thời gian.
        // Ví dụ:
        setTimeout(fetchDexSwap, 2000); // Thử lại sau 2 giây
      } else {
        console.error("Error fetching swap data:", error);
      }
    }
  }


  // handleSearch
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchInput(value);

    // Lọc danh sách token theo tên nhập vào
    const filtered = tokenList.filter((token) =>
      token.name.toLowerCase().includes(value) || token.ticker.toLowerCase().includes(value)
    );

    setFilteredTokens(filtered); // Cập nhật danh sách token đã lọc
  };

  // handleSearch



  useEffect(() => {
    fetchListToken()
  }, [])

  useEffect(() => {
    fetchPrices(tokenList[0].address, tokenList[1].address)
  }, [])


  useEffect(() => {
    if (txDetail.to && isConnected) {
      sendTransaction();
    }


  }, [txDetail])


  useEffect(() => {

    messageApi.destroy();

    if (isLoading) {
      messageApi.open({
        type: 'loading',
        content: 'Transaction is Pending...',
        duration: 0,
      })
    }

  }, [isLoading])

  useEffect(() => {
    messageApi.destroy();
    if (isSuccess) {
      messageApi.open({
        type: 'success',
        content: 'Transaction Successful',
        duration: 1.5,
      })
    } else if (txDetail.to) {
      messageApi.open({
        type: 'error',
        content: 'Transaction Failed',
        duration: 1.50,
      })
    }


  }, [isSuccess])



  const settings = (
    <>
      <div>Slippage Tolerance</div>
      <div>
        <Radio.Group value={slippage} onChange={handleSlippageChange}>
          <Radio.Button value={0.5}>0.5%</Radio.Button>
          <Radio.Button value={2.5}>2.5%</Radio.Button>
          <Radio.Button value={5}>5.0%</Radio.Button>
        </Radio.Group>
      </div>
    </>
  );


  return (
    <>
      {contextHolder}
      <Modal open={isOpen} footer={null} onCancel={() => setIsOpen(false)} title="Select a Token">
        <input
          placeholder="Search name"
          className="inputs-Search"
          onChange={handleSearch}
          value={searchInput}
        />
        <div className="modalContent">
          {filteredTokens?.map((e, i) => (
            <div className="tokenChoice" key={i} onClick={() => modifiToken(i)}>
              <img src={e.img} alt={e.ticker} className="tokenLogo" />
              <div className="tokenChoiceNames">
                <div className="tokenName">{e.name}</div>
                <div className="tokenName">{e.ticker}</div>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <div className="tradeBox">
        <div className="tradeBoxHeader">
          <h4>Swap</h4>
          <Popover
            content={settings}
            title="Settings"
            trigger="click"
            placement="bottomRight"
          >
            <SettingOutlined className="cog" />
          </Popover>
        </div>
        <div className="inputs">
          <Input placeholder="0" value={tokenOneAmount} onChange={changeAmount} disabled={!prices} />
          <Input placeholder="0" value={tokenTwoAmount} disabled={true} />
          {tokenOneAmount && prices ? (
            <>
              <div className="usdDisplay1">
                <span>~{(tokenOneAmount * prices.tokenOne).toFixed(2)} USD</span>
              </div>
              <div className="usdDisplay2">
                <span>~{(tokenTwoAmount * prices.tokenTwo).toFixed(2)} USD</span>
              </div>
            </>


          ) : null}
          <div className="switchButton" onClick={switchTokens}>
            <ArrowDownOutlined className="switchArrow" />
          </div>
          <div className="assetOne" onClick={() => openModal(1)}>
            <img src={tokenOne.img} alt="oneLogo" className="assetLogo"></img>
            {tokenOne.ticker}
            <DownOutlined />
          </div>
          <div className="assetTwo" onClick={() => openModal(2)}>
            <img src={tokenTwo.img} alt="oneLogo" className="assetLogo"></img>
            {tokenTwo.ticker}
            <DownOutlined />
          </div>
        </div>
        <div className="swapButton" disabled={!tokenOneAmount || !isConnected} onClick={fetchDexSwap}>Swap</div>
      </div>
    </>
  )
}
