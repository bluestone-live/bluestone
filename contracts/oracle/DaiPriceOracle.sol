pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '../common/interface/IERC20.sol';
import '../common/interface/IMedianizer.sol';
import '../common/interface/IOasisDex.sol';
import '../common/lib/DateTime.sol';
import '../common/lib/SafeMath.sol';
import '../common/lib/Math.sol';
import '../common/Ownable.sol';
import './interface/IPriceOracle.sol';

contract DaiPriceOracle is IPriceOracle, Ownable {
    using SafeMath for uint256;

    uint256 constant EXPECTED_PRICE = 10**18; // 1.0

    // Minimum time difference in hours to trigger price fetch
    uint256 constant MIN_HOURS_DIFF = 1;

    // Minimum price difference to trigger price update
    uint256 constant MIN_PRICE_DIFF = 10**16; // 0.01 (1%)

    event PriceUpdated(uint256 price);

    IERC20 public weth;
    IERC20 public dai;
    IMedianizer public medianizer;
    IOasisDex public oasis;
    address public uniswap;
    uint256 public oasisEthAmount;
    uint256 public priceUpperBound;
    uint256 public priceLowerBound;
    uint256 public price;
    uint256 public lastFetchedAt;
    uint256 public lastUpdatedAt;

    constructor(
        IERC20 _weth,
        IERC20 _dai,
        IMedianizer _medianizer,
        IOasisDex _oasis,
        address _uniswap,
        uint256 _oasisEthAmount,
        uint256 _priceUpperBound,
        uint256 _priceLowerBound
    ) public {
        weth = _weth;
        dai = _dai;
        medianizer = _medianizer;
        oasis = _oasis;
        uniswap = _uniswap;
        oasisEthAmount = _oasisEthAmount;
        priceUpperBound = _priceUpperBound;
        priceLowerBound = _priceLowerBound;
        price = EXPECTED_PRICE;
        lastFetchedAt = now;
        lastUpdatedAt = now;
    }

    function setPriceBoundary(
        uint256 _priceUpperBound,
        uint256 _priceLowerBound
    ) external onlyOwner {
        priceUpperBound = _priceUpperBound;
        priceLowerBound = _priceLowerBound;
    }

    function updatePriceIfNeeded() external override {
        if (DateTime.getHour(now - lastFetchedAt) < MIN_HOURS_DIFF) {
            return;
        }

        uint256 newPrice = fetchPrice();
        lastFetchedAt = now;

        /// Do not update price if:
        /// 1. Price diff is too small, or
        /// 2. New price is smaller than lower bound or larger than upper bound
        if (
            (newPrice > price && newPrice.sub(price) < MIN_PRICE_DIFF) ||
            (newPrice < price && price.sub(newPrice) < MIN_PRICE_DIFF) ||
            (newPrice < priceLowerBound || newPrice > priceUpperBound)
        ) {
            return;
        }

        price = newPrice;
        lastUpdatedAt = now;

        emit PriceUpdated(price);
    }

    function getPrice() external view override returns (uint256) {
        return price;
    }

    function fetchPrice() public view returns (uint256) {
        uint256 ethUsd = getMedianizerPrice();
        uint256 oasisPrice = getOasisPrice(ethUsd);
        uint256 uniswapPrice = getUniswapPrice(ethUsd);

        return _getMidValue(oasisPrice, uniswapPrice, EXPECTED_PRICE);
    }

    function getMedianizerPrice() public view returns (uint256) {
        return uint256(medianizer.read());
    }

    function getOasisPrice(uint256 ethUsd) public view returns (uint256) {
        /// If exchange is not operational, return old value.
        /// This allows the price to move only towards 1 USD
        if (
            oasis.isClosed() || !oasis.buyEnabled() || !oasis.matchingEnabled()
        ) {
            return price;
        }

        /// Assumes at least `oasisEthAmount` of depth on both sides of the book
        /// if the exchange is active. Will revert if not enough depth.
        uint256 daiAmt1 = oasis.getBuyAmount(
            address(dai),
            address(weth),
            oasisEthAmount
        );
        uint256 daiAmt2 = oasis.getPayAmount(
            address(dai),
            address(weth),
            oasisEthAmount
        );

        uint256 num = oasisEthAmount.mul(daiAmt2).add(
            oasisEthAmount.mul(daiAmt1)
        );
        uint256 den = daiAmt1.mul(daiAmt2).mul(2);

        return ethUsd.mul(num).div(den);
    }

    function getUniswapPrice(uint256 ethUsd) public view returns (uint256) {
        uint256 ethAmt = uniswap.balance;
        uint256 daiAmt = dai.balanceOf(uniswap);
        return ethUsd.mul(ethAmt).div(daiAmt);
    }

    function _getMidValue(uint256 a, uint256 b, uint256 c)
        private
        pure
        returns (uint256)
    {
        uint256 maximum = Math.max(a, Math.max(b, c));

        if (maximum == a) {
            return Math.max(b, c);
        } else if (maximum == b) {
            return Math.max(a, c);
        } else {
            return Math.max(a, b);
        }
    }
}
