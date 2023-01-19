//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}

contract Escrow {
    address payable public seller;
    address public nftAddress;
    address public lender;
    address public inspector;

    modifier onlySeller(){
        require(msg.sender==seller,"only seller can call this method");
        _;
    }
     
    modifier onlyBuyer(uint256 _nftID){
        require(msg.sender==buyer[_nftID],"only buyer of this nft can call this method");
        _;
    }

    modifier onlyInspector(){
        require(msg.sender==inspector,"only seller can call this method");
        _;
    }
    mapping (uint256 => bool) public isListed;
    mapping (uint256 => uint256) public purchasePrice;
    mapping (uint256 => uint256) public escrowAmount;
    mapping (uint256 => address) public buyer;
    mapping (uint256 => bool) public inspectionPassed;
    mapping (uint256 => mapping(address=>bool)) public approval;


    constructor(address payable _seller,address _nftAddress, address payable _lender, address payable _inspector){
        seller = _seller;
        nftAddress = _nftAddress;
        lender = _lender;
        inspector = _inspector;
    }
     
    receive() external payable{} 
     
     function getBalance() public view returns(uint256){
        return address(this).balance;
     }
    function list(uint256 _nftID,address _buyer,uint256 _purchasePrice,uint256 _escrowAmount) public payable onlySeller{
        //transfers nft from seller to this contract
        IERC721(nftAddress).transferFrom(msg.sender,address(this),_nftID);
        isListed[_nftID]=true;
        purchasePrice[_nftID]=_purchasePrice;
        escrowAmount[_nftID]=_escrowAmount;
        buyer[_nftID]=_buyer;
    }

    function depositEarnest(uint256 _nftID) public payable onlyBuyer(_nftID){
        require(msg.value >= escrowAmount[_nftID]);
    } 

    function updateInspectionStatus(uint256 _nftID,bool _passed) public onlyInspector {
        inspectionPassed[_nftID]=_passed;
    }

    function approveSale(uint256 _nftID) public {
        approval[_nftID][msg.sender]=true;
    }
    
    //process the final sale
    function finalizeSale(uint256 _nftID) public {
        require(inspectionPassed[_nftID],"this nft is not inspected");
        require(approval[_nftID][buyer[_nftID]]);
        require(approval[_nftID][seller]);
        require(approval[_nftID][lender]);
        require(address(this).balance>=purchasePrice[_nftID]);
        isListed[_nftID] = false;
        (bool success, ) = payable(seller).call{value: address(this).balance}("");
        require(success);
        IERC721(nftAddress).transferFrom(address(this),buyer[_nftID],_nftID);
    }
}