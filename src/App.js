import { Routes, Route,useNavigate,  Link } from "react-router-dom";
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

import { clusterApiUrl, Connection, PublicKey, LAMPORTS_PER_SOL,
   Transaction, SystemProgram, sendAndConfirmTransaction, Keypair } from '@solana/web3.js';
import React, { useState, FC, ReactNode, useMemo, useCallback, useEffect } from 'react';
import * as bs58 from "bs58";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";
import { Account } from "@metaplex-foundation/mpl-core";
import {TOKEN_PROGRAM_ID, createTransferCheckedInstruction,getOrCreateAssociatedTokenAccount, 
  transferChecked, createApproveCheckedInstruction, AccountLayout,
  createMint, approveChecked, createTransferInstruction} from '@solana/spl-token';
  import axios from "axios";
  require('./App.css');
  require('@solana/wallet-adapter-react-ui/styles.css');
  const splToken = require("@solana/spl-token");
  const web3 = require("@solana/web3.js");

let tokensInWallet = []
const CREATOR_ADDRESS = "FpxeTiprQeXRiMurJNQwDfXLDkYD1T1CrMH5KhJbUQ63"
let thelamports = 0;
let theWallet = "FpxeTiprQeXRiMurJNQwDfXLDkYD1T1CrMH5KhJbUQ63"
const RANDOM_VALUE = 1
const App = () => {
    return (
        <Context>
          <Routes>
            <Route path="/" element={<Content />} />
            <Route path="buy-chacana" element={<>Comprar chacanas</>} />
          </Routes>
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
    const [lamports, setLamports] = useState(.1);
    const [matchedCreator, setMatchedCreator] = useState(false);
    const [ creatorTokensAmount ,setCreatorTokensAmount] = useState(0);
    const [totalNfts, setTotalNfts] = useState(0)
    const [creatorNfts, setCreatorNfts] = useState([])
    const [flipResult, setFlipResult] = useState("")
    const connection = new Connection("https://metaplex.devnet.rpcpool.com/");
    const navigate = useNavigate();
    
    //getTokenAccountsByOwner(publicKey,)
    async function getTheTokensOfOwner(MY_WALLET_ADDRESS){
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
        setMatchedCreator(false)
        setTotalNfts(accounts.length)
      let conunterIndex= 0 
      accounts.forEach(async (account, i) => {
        // console.log('error', i)
        let mint_s = account.account.data["parsed"]["info"]["mint"]
        try{
          const metadata = await getAccountMetaData(mint_s);
          // console.log('mint0', mint_s, metadata)
          if (CREATOR_ADDRESS === metadata?.creators[1].address && parseInt(metadata.tokenSupply) > 0){
            console.log('mint', mint_s, metadata)
            setCreatorNfts(prev => [...prev, mint_s])
            setMatchedCreator(true)
            setCreatorTokensAmount(prev => prev+1)
            conunterIndex++
          }
        }
        catch (error) {
          console.log('error', error)          
        }
        if(i === accounts.length - 1 && conunterIndex === 0){
          console.log('conunterIndex', conunterIndex)
            setCreatorTokensAmount(-1)
            // navigate('/buy-chacana');
          }
      });

    }
    
    async function getAccountMetaData(tokenAdr){
      try {
        const metadataPDA = await Metadata.getPDA(tokenAdr);
        const mintAccInfo = await connection.getAccountInfo(metadataPDA);
        const tokenInfo = await axios.get(`https://api.solscan.io/account?address=${tokenAdr}&cluster=devnet`)
        const tokenSupply = tokenInfo?.data?.data?.tokenInfo?.supply

        const {
          data: { data: metadata }
        } = Metadata.from(new Account(tokenAdr, mintAccInfo));
        return {...metadata, tokenSupply};
        
      } catch (error) {
        console.log('error', error)
      }
    }
    
    const { publicKey, sendTransaction, signTransaction } = useWallet();

    const getProvider = async () => {
      if ("solana" in window) {
        const provider = window.solana;
        if (provider.isPhantom) {
          console.log("Is Phantom installed?  ", provider.isPhantom);
          return provider;
        }
      } else {
        window.open("https://www.phantom.app/", "_blank");
      }
    };

    const onClick1 = useCallback( async () => {
      
      const toPubkey = "5kJDT3qraQQ87GDURhtBuBmSL9wrJnqm3Ctg8e8f9aXi";
      const amount = 1;
      if (!toPubkey || !amount) return

      try {
          if (!publicKey || !signTransaction) throw new WalletNotConnectedError()
          const toPublicKey = new PublicKey(toPubkey)
          const mint = new PublicKey('C4ZB7RM23dWWs8GoFaLWcAMCeDupwPSWU3j16nDHXSAk')

          const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
              connection,
              publicKey,
              mint,
              publicKey,
              signTransaction
          )

          const toTokenAccount = await getOrCreateAssociatedTokenAccount(
              connection,
              publicKey,
              mint,
              toPublicKey,
              signTransaction
          )

          const transaction = new Transaction().add(
              createTransferInstruction(
                  fromTokenAccount.address, // source
                  toTokenAccount.address, // dest
                  publicKey,
                  amount,
                  [],
                  TOKEN_PROGRAM_ID
              )
          )

          const blockHash = await connection.getRecentBlockhash()
          transaction.feePayer = await publicKey
          transaction.recentBlockhash = await blockHash.blockhash
          const signed = await signTransaction(transaction)

          await connection.sendRawTransaction(signed.serialize())

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error) {
          console.log(`Transaction failed: ${error.message}`)
      }

  }, [publicKey, sendTransaction, connection]);
      

  
    const verifyCreator = async() => {

      const random = Math.floor(Math.random() * 4);
      console.log('random number', random)
      if (random === RANDOM_VALUE){
        setFlipResult('you win')
      }
      else setFlipResult('you lose')
      // return (<>{matchedCreator ? alert("Cuanto es 5 + 5"):alert("Aun no tienes una chacana")}</>)
    }

    const onClick = useCallback( async () => {
      tokensInWallet = []

      if (!publicKey) throw new WalletNotConnectedError();
      connection.getBalance(publicKey).then((bal) => {
        console.log(bal/LAMPORTS_PER_SOL);
        
      });
      
      console.log(publicKey.toBase58());
      getTheTokensOfOwner(publicKey.toBase58());
      
    }, [publicKey, sendTransaction, connection, matchedCreator]);
      
    useEffect( ()=>{
      setFlipResult("")
      const res = async() =>{
        await onClick()
      } 
      res()
    },[publicKey])

    useEffect(() =>{
      // console.log('counter tokens', creatorTokensAmount, totalNfts);
    }, [creatorTokensAmount])
    
      return (
      <div className="navbar">
        <div className="navbar-inner">
          <ul className='nav pull-right'>
            <WalletMultiButton />
          </ul>
        </div>
        <div>
          {creatorTokensAmount > 0?
          <>
            <button className='flip-coin' onClick={()=>verifyCreator()}>Flip Coin</button>
            <h3 className='flip-coin'>{flipResult}</h3>
          </>
          :creatorTokensAmount === -1 ?
          <button className='flip-coin' onClick={()=>verifyCreator()}>Buy a New Nft</button>
          :""
          }
        </div>
          <br></br> 
          <h1>Total creator tokens
            <h3>{creatorTokensAmount > 0 ? creatorTokensAmount: 0}</h3>
          </h1>
          <button className='flip-coin' onClick={()=>onClick1()}>Transfer</button>
      </div>
    );
};
