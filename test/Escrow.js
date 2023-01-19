const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Escrow', () => {
     let buyer, seller,inspector,lender;
     let realEstateInstance,escrowInstance;

    beforeEach(async () => {
        // Setup accounts
        [buyer, seller, inspector, lender] = await ethers.getSigners()

        // Deploying Real Estate contract
        const RealEstate = await ethers.getContractFactory('RealEstate')
        realEstateInstance = await RealEstate.deploy()

        // Mint on behalf of seller
        let transaction = await realEstateInstance.connect(seller).mint("https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS")
        await transaction.wait()

        // Deploy Escrow
        const Escrow = await ethers.getContractFactory('Escrow')
        escrowInstance = await Escrow.deploy(
            
            seller.address,
            realEstateInstance.address,
            
            lender.address,
            inspector.address
        )

        //Approve property
        transaction = await realEstateInstance.connect(seller).approve(escrowInstance.address, 1);
        await transaction.wait();

        //List property 
        transaction = await escrowInstance.connect(seller).list(1,buyer.address,tokens(10),tokens(5));
        await transaction.wait();
    })

    describe('Deployment', () => {
        it('Returns NFT address', async () => {
            const result = await escrowInstance.nftAddress()
            expect(result).to.be.equal(realEstateInstance.address)
        })

        it('Returns seller', async () => {
            const result = await escrowInstance.seller()
            expect(result).to.be.equal(seller.address)
        })

        it('Returns inspector', async () => {
            const result = await escrowInstance.inspector()
            expect(result).to.be.equal(inspector.address)
        })

        it('Returns lender', async () => {
            const result = await escrowInstance.lender()
            expect(result).to.be.equal(lender.address)
        })
    })

    describe('Listing', () => {
        it(' transfers ownership of nft from seller to escrow contract ', async () => {
          expect(await realEstateInstance.ownerOf(1)).to.be.equal(escrowInstance.address);
         })
        it('updates as listed',async ()=>{
          const result = await escrowInstance.isListed(1);
          expect(result).to.be.equal(true);  
        }) 

        it('returns buyer',async()=>{
            const result = await escrowInstance.buyer(1);
            expect(result).to.be.equal(buyer.address);
        })

        it('returns purchase price',async()=>{
            const result = await escrowInstance.purchasePrice(1); 
            expect(result).to.be.equal(tokens(10));
        })

        it('returns escrow amount ',async()=>{
            const result = await escrowInstance.escrowAmount(1);
            expect(result).to.be.equal(tokens(5));
        })
    })

    describe('Deposits', () => {
        it('Updates contract balance', async () => {
          const transaction = await escrowInstance.connect(inspector).updateInspectionStatus(1,true)
          await transaction.wait();
          const result = await escrowInstance.inspectionPassed(1);
          expect(result).to.be.equal(true);
         })


    
    })
     
    describe('Approval', () => {
        it('Approves the purchase ', async () => {
          let transaction = await escrowInstance.connect(buyer).approveSale(1);
          await transaction.wait();
          expect(await escrowInstance.approval(1,buyer.address)).to.be.equal(true);

          transaction = await escrowInstance.connect(seller).approveSale(1);
          await transaction.wait();
          expect(await escrowInstance.approval(1,seller.address)).to.be.equal(true);

          transaction = await escrowInstance.connect(lender).approveSale(1);
          await transaction.wait();
          expect(await escrowInstance.approval(1,lender.address)).to.be.equal(true);
         
         })


    
    })

    describe('Sale', () => {
       beforeEach(async()=>{
          let transaction = await escrowInstance.connect(buyer).depositEarnest(1,{value: tokens(5)})
          await transaction.wait();

          transaction = await escrowInstance.connect(inspector).updateInspectionStatus(1,true)
          await transaction.wait()

          transaction = await escrowInstance.connect(buyer).approveSale(1)
          await transaction.wait()

         transaction = await escrowInstance.connect(seller).approveSale(1)
          await transaction.wait()
          
          transaction = await escrowInstance.connect(lender).approveSale(1)
          await transaction.wait()

          await lender.sendTransaction({to:escrowInstance.address, value: tokens(5)})
          
          transaction = await escrowInstance.connect(seller).finalizeSale(1);
          await transaction.wait();

       })
       
        it('successfully completes the sale ', async () => {
          expect(await escrowInstance.getBalance()).to.be.equal(0)
        //   let sellerBalance = await seller.balance;
        //   console.log(sellerBalance)
        //   expect(sellerBalance).to.be.equal(tokens(10));
         })

         it('updates the ownership of nft',async()=>{
            let owner = await realEstateInstance.ownerOf(1);
            expect(owner).to.be.equal(buyer.address);
         })

    
    })

     
}) 