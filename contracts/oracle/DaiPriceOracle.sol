// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.7;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/math/Math.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '../common/interface/IMedianizer.sol';
import '../common/interface/IOasisDex.sol';
import '../common/lib/DateTime.sol';
import './interface/IPriceOracle.sol';

contract DaiPriceOracle is IPriceOracle, Ownable {
    using SafeMath for uint256;

    uint256 constant EXPECTED_PRICE = 10**18; // 1.0

    // Minimum time difference in hours to trigger price fetch
    uint256 constant MIN_HOURS_DIFF = 1;

    // Minimum price difference to trigger price update
    uint256 constant MIN_PRICE_DIFF = 10**16; // 0.01 (1%)

    event PriceUpdated(uint256 price);
    event SetOasisEthAmountSucceed(
        address indexed adminAddress,
        uint256 oasisEthAmount
    );
    event SetPriceBoundarySucceed(
        address indexed adminAddress,
        uint256 priceUpperBound,
        uint256 priceLowerBound
    );
    event GetOasisPriceSucceed(uint256 oasisEthAmount, uint256 oasisPrice);
    event GetOasisPriceFailed(uint256 oasisEthAmount, uint256 oldPrice);

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
    ) {
        weth = _weth;
        dai = _dai;
        medianizer = _medianizer;
        oasis = _oasis;
        uniswap = _uniswap;
        oasisEthAmount = _oasisEthAmount;
        priceUpperBound = _priceUpperBound;
        priceLowerBound = _priceLowerBound;
        price = EXPECTED_PRICE;
        lastFetchedAt = block.timestamp;
        lastUpdatedAt = block.timestamp;
    }

    function setOasisEthAmount(uint256 _oasisEthAmount) external onlyOwner {
        require(_oasisEthAmount > 0, 'DaiPriceOracle: invalid oasisEthAmount');

        oasisEthAmount = _oasisEthAmount;

        emit SetOasisEthAmountSucceed(msg.sender, _oasisEthAmount);
    }

    function setPriceBoundary(
        uint256 _priceUpperBound,
        uint256 _priceLowerBound
    ) external onlyOwner {
        require(
            _priceUpperBound > EXPECTED_PRICE,
            'DaiPriceOracle: invalid upper bound price'
        );
        require(
            _priceLowerBound < EXPECTED_PRICE,
            'DaiPriceOracle: invalid lower bound price'
        );

        priceUpperBound = _priceUpperBound;
        priceLowerBound = _priceLowerBound;

        emit SetPriceBoundarySucceed(
            msg.sender,
            _priceUpperBound,
            _priceLowerBound
        );
    }

    // prettier-ignore
    function updatePriceIfNeeded() external override {
        if (DateTime.getHour(block.timestamp - lastFetchedAt) < MIN_HOURS_DIFF) {
            return;
        }

        uint256 newPrice = fetchPrice();
        lastFetchedAt = block.timestamp;

        /// Do not update price if:
        /// 1. Price diff is too small, or
        /// 2. New price is smaller than lower bound or larger than upper bound
        if (
            (newPrice >= price && newPrice.sub(price) < MIN_PRICE_DIFF) ||
            (newPrice < price && price.sub(newPrice) < MIN_PRICE_DIFF) ||
            (newPrice < priceLowerBound || newPrice > priceUpperBound)
        ) {
            return;
        }

        price = newPrice;
        lastUpdatedAt = block.timestamp;

        emit PriceUpdated(price);
    }

    // prettier-ignore
    function getPrice() external view override returns (uint256) {
        return price;
    }

    function fetchPrice() public returns (uint256) {
        uint256 ethPrice = getMedianizerPrice();
        uint256 oasisPrice = getOasisPrice(ethPrice);
        uint256 uniswapPrice = getUniswapPrice(ethPrice);

        return _getMidValue(oasisPrice, uniswapPrice, EXPECTED_PRICE);
    }

    function getMedianizerPrice() public view returns (uint256) {
        return uint256(medianizer.read());
    }

    function getOasisPrice(uint256 ethUsd) public returns (uint256) {
        // If Oasis is not operational, return old price
        if (
            oasis.isClosed() || !oasis.buyEnabled() || !oasis.matchingEnabled()
        ) {
            return price;
        }

        try
            oasis.getBuyAmount(address(dai), address(weth), oasisEthAmount)
        returns (uint256 buyAmount) {
            if (buyAmount == 0) {
                emit GetOasisPriceFailed(oasisEthAmount, price);
                return price;
            }

            try
                oasis.getPayAmount(address(dai), address(weth), oasisEthAmount)
            returns (uint256 payAmount) {
                if (payAmount == 0) {
                    emit GetOasisPriceFailed(oasisEthAmount, price);
                    return price;
                }

                uint256 num = oasisEthAmount.mul(payAmount).add(
                    oasisEthAmount.mul(buyAmount)
                );
                uint256 den = buyAmount.mul(payAmount).mul(2);
                uint256 oasisPrice = ethUsd.mul(num).div(den);

                emit GetOasisPriceSucceed(oasisEthAmount, oasisPrice);
                return oasisPrice;
            } catch {
                /// In case there is not enough depth and the Oasis call reverts,
                /// emit an error event and return current price
                emit GetOasisPriceFailed(oasisEthAmount, price);
                return price;
            }
        } catch {
            /// In case there is not enough depth and the Oasis call reverts,
            /// emit an error event and return current price
            emit GetOasisPriceFailed(oasisEthAmount, price);
            return price;
        }
    }

    function getUniswapPrice(uint256 ethUsd) public view returns (uint256) {
        uint256 ethAmt = uniswap.balance;
        uint256 daiAmt = dai.balanceOf(uniswap);

        if (daiAmt == 0) {
            return price;
        } else {
            return ethUsd.mul(ethAmt).div(daiAmt);
        }
    }

    function _getMidValue(
        uint256 a,
        uint256 b,
        uint256 c
    ) private pure returns (uint256) {
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
