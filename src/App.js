//    getTheTokensOfOwner()
import { WalletAdapterNetwork,WalletNotConnectedError } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider, useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
    GlowWalletAdapter,
    PhantomWalletAdapter,
    SlopeWalletAdapter,
    SolflareWalletAdapter,
    TorusWalletAdapter,
    LedgerWalletAdapter,
    SolletExtensionWalletAdapter,
    SolletWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import ReactDOM from 'react-dom';

import { clusterApiUrl, Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import React, { useState, FC, ReactNode, useMemo, useCallback, useEffect } from 'react';

import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { Account } from "@metaplex-foundation/mpl-core";
// import { deprecated } from "@metaplex-foundation/mpl-token-metadata";
import {TOKEN_PROGRAM_ID} from '@solana/spl-token';
require('./App.css');
require('@solana/wallet-adapter-react-ui/styles.css');

let tokensInWallet = []
const CREATOR_ADDRESS = "FpxeTiprQeXRiMurJNQwDfXLDkYD1T1CrMH5KhJbUQ63"
let login = false;
const App = () => {
    return (
        <Context>
            <Content />
        </Context>
    );
};
export default App;

const Context = ({ children }) => {
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    const network = WalletAdapterNetwork.Devnet;

    // You can also provide a custom RPC endpoint.
    const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
    // Only the wallets you configure here will be compiled into your application, and only the dependencies
    // of wallets that your users connect to will be loaded.
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new GlowWalletAdapter(),
            new SlopeWalletAdapter(),
            new SolflareWalletAdapter({ network }),
            new TorusWalletAdapter(),
            new LedgerWalletAdapter(),
            new SolletExtensionWalletAdapter(),
            new SolletWalletAdapter(),
        ],
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

const Content = () => {

    const [matchedCreator, setMatchedCreator] = useState(false);

    const connection = new Connection("https://metaplex.devnet.rpcpool.com/");

    
    //getTokenAccountsByOwner(publicKey,)
    async function getTheTokensOfOwner(MY_WALLET_ADDRESS){
    
    
    (async () => {
      //const MY_WALLET_ADDRESS = "9m5kFDqgpf7Ckzbox91RYcADqcmvxW4MmuNvroD5H2r9";
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    
      const accounts = await connection.getParsedProgramAccounts(
        TOKEN_PROGRAM_ID, // new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
        {
          filters: [
            {
              dataSize: 165, // number of bytes
            },
            {
              memcmp: {
                offset: 32, // number of bytes
                bytes: MY_WALLET_ADDRESS, // base58 encoded string
              },
            },
          ],
        }
      );
    
      console.log(
        `Found ${accounts.length} token account(s) for wallet ${MY_WALLET_ADDRESS}: `
      );
      let totalNFTsI = 0;
      let matchedCreatorCount = 0;
       await accounts.forEach(async (account, i) => {
         // account.account.data;
         let amountI = account.account.data["parsed"]["info"]["tokenAmount"]["uiAmount"];
         let mint_s = account.account.data["parsed"]["info"]["mint"]
    
        if (amountI==1){
          totalNFTsI += 1;

          try{
            console.log(
              `-- Token Account Address ${i + 1}: ${account.pubkey.toString()} --`
            );
            console.log(`Mint: ${mint_s}`);
            let objT = {};
            objT.mint = mint_s
            objT.amount =amountI
            tokensInWallet.push(objT)
            const metadata = await getAccountMetaData(mint_s);
            if (CREATOR_ADDRESS == metadata?.creators[0].address){
              setMatchedCreator(true)
            }
            console.log('objecttt', objT)
           // let token_amount_i = account.account.data["parsed"]["info"]["tokenAmount"]["uiAmount"]
           console.log(
              `Amount: ${amountI}`
              
            ); 
          }catch{
            tokensInWallet.push({mint:mint_s,amount: amountI })
          }
        }
      
      });


      console.log("total NFTs: {}", totalNFTsI);

      let nfts_total_element = <span>({totalNFTsI})</span>;
 
      ReactDOM.render(nfts_total_element, document.getElementById("totalNFTs"))
 

      console.log("tokens: " + tokensInWallet)
      let currentI = 0
      await tokensInWallet.forEach(element => {
        console.log("element[currentI].mint"+element.mint)
        currentI+=1
      });
  
    
    })();
    }
    
    async function getAccountMetaData(tokenAdr){
      const metadataPDA = await Metadata.getPDA(tokenAdr);
      const mintAccInfo = await connection.getAccountInfo(metadataPDA);

      const {
        data: { data: metadata }
      } = Metadata.from(new Account(tokenAdr, mintAccInfo));
      return metadata;
    }
    
    const { publicKey, sendTransaction } = useWallet();

    
    const verifyCreator = () => {
      return (<>{matchedCreator ? alert("Cuanto es 5 + 5"):alert("Aun no tienes una chacana")}</>)
    }

    const onClick = useCallback( async () => {
      setMatchedCreator(false);
      tokensInWallet = []

      if (!publicKey) throw new WalletNotConnectedError();
      connection.getBalance(publicKey).then((bal) => {
        console.log(bal/LAMPORTS_PER_SOL);
        
      });
      
      console.log(publicKey.toBase58());
      getTheTokensOfOwner(publicKey.toBase58());
      
    }, [publicKey, sendTransaction, connection]);
      
    useEffect( ()=>{
      const res = async() =>{
        await onClick()
      } 
      res()
    },[publicKey])
      return (
        <div className="navbar">
            <div className="navbar-inner">
              <a className="brand" href="#">dApp</a>
              <ul className='nav pull-right'>
              <WalletMultiButton />

    </ul>
    </div>
      <div className='container-fluid' id='nfts'>
        <button onClick={()=>verifyCreator()}>get NFTs</button>
        <br></br>  <h1>NFTs in wallet <span id='totalNFTs'></span></h1>
        {tokensInWallet.length ? 
        <ul>
          {tokensInWallet.map((token, i) => <li key={i}>{token?.mint}</li>)}
        </ul>
        :null}
        
      </div>
    </div>
    );
};
