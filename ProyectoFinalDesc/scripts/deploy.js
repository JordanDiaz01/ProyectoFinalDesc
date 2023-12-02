

async function main(){
    const ArGramNFT = await ethers.getContractFactory("ArGram");
    const arGramNFT = await ArGramNFT.deploy();
    const txHash = arGramNFT.deployTransaction.hash;
    const txReceipt = await ethers.provider.waitForTransaction(txHash);
    console.log("Contract deployed to address:", txReceipt.contractAddress)
}

main()
    .then(()=>{process.exit(0)})
    .catch((error) => {console.log(error), process.exit(1)})