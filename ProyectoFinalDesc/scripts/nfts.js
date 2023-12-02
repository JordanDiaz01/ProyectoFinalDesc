require('dotenv').config();
const fs = require('fs')
const FormData = require('form-data');
const axios = require("axios")
const { ethers } = require("ethers")

const contract = require("../artifacts/contracts/NFTContract.sol/ArGram.json");
const {
    PINATA_API_KEY,
    PINATA_SECRET_KEY,
    API_URL,
    PRIVATE_KEY,
    PUBLIC_KEY,
    CONTRACT_ADDRESS
} = process.env;

async function createImgInfo() {
    const authResponse = await axios.get("https://api.pinata.cloud/data/testAuthentication", {
        headers: {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_KEY,
        },
    });
    console.log(authResponse)
    const stream = fs.createReadStream("./images/jhony.jpeg")
    const data = new FormData()
    data.append("file", stream)
    const fileResponse = await
        axios.post(
            "https://api.pinata.cloud/pinning/pinFileToIPFS",
            data,
            {
                headers: {
                    "Content-Type": `multipart/form-data; boundary=${data._boundary}`,
                    pinata_api_key: PINATA_API_KEY,
                    pinata_secret_api_key: PINATA_SECRET_KEY
                }
            })
    const { data: fileData = {} } = fileResponse;
    const { IpfsHash } = fileData;
    const fileIPFS = `https://gateway.pinata.cloud/ipfs/${IpfsHash}`;
    console.log(fileIPFS)
}

async function createJsonInfo() {
    const metadata = {
        image: "https://gateway.pinata.cloud/ipfs/Qmess53RGnbTJyiNeFkA7Gi9xGF4KECBHojXP3qJeYjp24",
        name: "Mascota del club de VR",
        description: "XD",
        attributes: [
            { "trait_type": "color", "value": "brown" },
            { "trait_type": "background", "value": "white" },
        ]
    }
    const pinataJSONBody = {
        pinataContent: metadata
    }
    const jsonResponse = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        pinataJSONBody,
        {
            headers: {
                "Content-Type": "application/json",
                pinata_api_key: PINATA_API_KEY,
                pinata_secret_api_key: PINATA_SECRET_KEY
            }
        }
    )
    const { data: jsonData = {} } = jsonResponse;
    const { IpfsHash } = jsonData;
    const tokenURI = `https://gateway.pinata.cloud/ipfs/${IpfsHash}`;
    console.log(tokenURI)
}

async function mintNFT() {
    const provider = new ethers.providers.JsonRpcProvider(API_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const etherInterface = new ethers.utils.Interface(contract.abi);
    const nonce = await provider.getTransactionCount(PUBLIC_KEY, "latest")
    const gasPrice = await provider.getGasPrice();
    const network = await provider.getNetwork();
    const { chainId } = network;
    const transaction = {
        from: PUBLIC_KEY,
        to: CONTRACT_ADDRESS,
        nonce,
        chainId,
        gasPrice,
        data: etherInterface.encodeFunctionData("mintNFT",
            [PUBLIC_KEY, "https://gateway.pinata.cloud/ipfs/QmUkHzEQRQBzoLCARNB51SzP1uZK8con4GarBH8FqHFVTn"])
    }
    const estimateGas = await provider.estimateGas(transaction)
    transaction["gasLimit"] = estimateGas;
    const singedTx = await wallet.signTransaction(transaction)
    const transactionReceipt = await provider.sendTransaction(singedTx);
    await transactionReceipt.wait()
    const hash = transactionReceipt.hash;
    console.log("Your Transaction has is:", hash)

    const receipt = await provider.getTransactionReceipt(hash);
    const { logs } = receipt;
    const tokenInBigNumber = ethers.BigNumber.from(logs[0].topics[3]);
    const tokenId = tokenInBigNumber.toNumber();
    console.log("NFT token id", tokenId)
}
createImgInfo()
//createJsonInfo()
//mintNFT()