import React, { useState } from 'react'
import Logo from '../moralis-logo.svg'
import eth from '../eth.svg'
import bnb from '../bnb-bnb-logo.svg'
import { Link } from 'react-router-dom'
import { Select } from 'antd';
import { Dropdown, Space } from 'antd';
import { DownOutlined } from '@ant-design/icons';

function Header(props) {

  const { connect, isConnected, address } = props

  const [selectedNetwork, setSelectedNetwork] = useState({
    value: "Ethereum",
    logo: eth,
  });

  const handleNetworkChange = (key) => {
    console.log(`Selected network: ${key}`);
    if (key === "ETH") {
      setSelectedNetwork({ value: "Ethereum", logo: eth });
    } else if (key === "BNB") {
      setSelectedNetwork({ value: "BNB Chain", logo: bnb });
    }
  };

  const items = [
    {
      label: (
        <div className='headerItemNetWork' onClick={() => handleNetworkChange("ETH")}>
          <img src={eth} alt='Ethereum logo' className='eth' />
          Ethereum
        </div>
      ),
      key: 'ETH',
    },
    {
      label: (
        <div className='headerItemNetWork' onClick={() => handleNetworkChange("BNB")}>
          <img src={bnb} alt='BNB logo' style={{ width: 23, height: 23 }} className='eth' />
          BNB Chain
        </div>
      ),
      key: 'BNB',
    },
  ];


  return (
    <header>
      <div className='leftH'>
        <img src='/image/logo-cehsoft.png' alt='logo' className='logo' />
        <Link to='/token' className='link'>
          <div className='headerItem'>Tokens</div>
        </Link>
        <Link to='/' className='link'>
          <div className='headerItem'>Swap</div>
        </Link>

      </div>
      <div className='rightH'>
        {/* <div className='headerItem'>
          <img src={eth} alt='logo' className='eth' />
          Ethereum
        </div> */}
        <Dropdown
          menu={{
            items,
          }}
        >
          <a onClick={(e) => e.preventDefault()}>
            <div className='headerItem'>
              <img src={selectedNetwork.logo} alt={`${selectedNetwork.value} logo`} style={{ width: 23, height: 23 }} className='eth' />
              {selectedNetwork.value} <DownOutlined />
            </div>
          </a>
        </Dropdown>
        <div className='connectButton' onClick={connect}>
          {isConnected ? (address.slice(0, 4) + "..." + address.slice(38)) : "Connect"}
        </div>
      </div>
    </header>

  )
}

export default Header