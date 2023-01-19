//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
contract RealEstate is ERC721URIStorage{
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    constructor() ERC721("Real Estate", "REAL") {}
    function mint(string memory tokenURI) public returns (uint256) {
        _tokenIds.increment();
        uint256 newItemID = _tokenIds.current();
        _mint(msg.sender,newItemID);
        _setTokenURI(newItemID,tokenURI);
        return newItemID;
    }
    function totalSupply() public view returns(uint256){
        return _tokenIds.current();
    }
 }
