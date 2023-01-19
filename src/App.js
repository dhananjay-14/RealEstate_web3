import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

// Components
import Navigation from './components/Navigation';
import Search from './components/Search';
import Home from './components/Home';

// ABIs
import RealEstate from './abis/RealEstate.json'
import Escrow from './abis/Escrow.json'

// Config
import config from './config.json';

function App() {
 
  const [provider,setProvider]=useState(null);
  const [escrow,setEscrow]= useState(null);
  const [account,setAccount] = useState(null);
  const [homes,setHomes] = useState([]);
  const [home, setHome] = useState({})
  const [toggle, setToggle] = useState(false);

  const loadBlockchainData = async ()=>{
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);
    window.ethereum.on('accountsChanged',async()=>{
      const accounts = await window.ethereum.request({method:'eth_requestAccounts'});
      setAccount(accounts[0]);
    })
   
    
    const network = await provider.getNetwork();
   
    const realEstate = new ethers.Contract(config[network.chainId].realEstateInstance.address, RealEstate, provider)
    //console.log(realEstate)
    const totalSupply = await realEstate.totalSupply();
    
    console.log('the total supply is '+totalSupply)
    
    const escrow = new ethers.Contract(config[network.chainId].escrowInstance.address,Escrow, provider);
    setEscrow(escrow);
    
    const homes=[];
    
    for(var i=1;i<=totalSupply;i++)
    {
      const uri = await realEstate.tokenURI(i);
      const response = await fetch(uri);
      const metadata = await response.json()
      homes.push(metadata)      
    }
    
    setHomes(homes);
    console.log(homes)
   
   
    console.log('loaded blockchain data successfully')
   
  }

  useEffect(()=>{
    loadBlockchainData();
  },[])

   const togglePop = (home) => {
    setHome(home)
    toggle ? setToggle(false) : setToggle(true);
  }

 // console.log('selected account is '+ account);
  return (
    <div>
      <Navigation account={account} setAccount={setAccount}/>
      <Search/>
      <div className='cards__section'>

        <h3>Homes For You </h3>
        <hr/>
        <div className='cards'>
          {homes.map((home,index)=>(
            <div className='card' key={index} onClick={() => togglePop(home)}>
            <div className='card__image'>
              <img src={home.image} alt='Home'/>
            </div>
            <div className='card__info'>
              <h4>{home.attributes[0].value} ETH</h4>
              <p>
                <strong>{home.attributes[2].value}</strong> bds|
                <strong>{home.attributes[3].value}</strong> ba |
                <strong>{home.attributes[4].value}</strong> sqft
              </p>
              <p>{home.address}</p>
            </div>
          </div>
          ))
          }
          
        </div>
      </div>
      {toggle && (
        <Home home={home} provider={provider} account={account} escrow={escrow} togglePop={togglePop} />
      )}
    </div>
  );
}

export default App;