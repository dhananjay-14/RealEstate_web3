// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}
async function main() {
  // Setup accounts
  [buyer, seller, inspector, lender] = await ethers.getSigners();

  // Deploying Real Estate contract
  const RealEstate = await ethers.getContractFactory('RealEstate')
  const realEstateInstance = await RealEstate.deploy()
  await realEstateInstance.deployed()

  console.log(`Deployed Real Estate Contract at: ${realEstateInstance.address}`)
  console.log(`Minting 3 properties...\n`)

   for (let i = 0; i < 3; i++) {
    const transaction = await realEstateInstance.connect(seller).mint(`https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${i + 1}.json`)
    await transaction.wait()
  }

   // Deploy Escrow
   const Escrow = await ethers.getContractFactory('Escrow')
   escrowInstance = await Escrow.deploy(
       
       seller.address,
       realEstateInstance.address,
       
       lender.address,
       inspector.address
   )
   await escrowInstance.deployed();

   console.log(`Deployed Escrow Contract at: ${escrowInstance.address}`)
   console.log(`Listing 3 properties...\n`)

   // Approve properties...
   for (let i = 0; i < 3; i++) {
    let transaction = await realEstateInstance.connect(seller).approve(escrowInstance.address, i + 1)
    await transaction.wait()
  }

   // Listing properties...
   transaction = await escrowInstance.connect(seller).list(1, buyer.address, tokens(20), tokens(10))
   await transaction.wait()
 
   transaction = await escrowInstance.connect(seller).list(2, buyer.address, tokens(15), tokens(5))
   await transaction.wait()
 
   transaction = await escrowInstance.connect(seller).list(3, buyer.address, tokens(10), tokens(5))
   await transaction.wait()
 
   console.log(`Finished.`)
 }



// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
