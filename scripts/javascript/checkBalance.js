const { makeTruffleScript, loadNetwork } = require('../utils.js');
const { BN } = require('web3-utils');
const Protocol = artifacts.require('Protocol');
const debug = require('debug')('script:checkBalance');

module.exports = makeTruffleScript(async network => {
  if (network === 'main') {
    throw new Error('Please deploy manually for mainnet.');
  }

  const net = loadNetwork(network);
  const protocolAddress = net.contracts.Protocol;
  const tokens = Object.keys(net.tokens).map(name => {
    return {
      symbol: name,
      address: net.tokens[name].address,
    };
  });

  const result = await Promise.all(
    tokens.map(async t => {
      const [
        depositAmount,
        withdrawAmount,
        earlyWithdrawAmount,
        interesetForProtocolReserve,
        interestForDepositDistributor,
        loanDistributorInterest,
        { loanAmount, collateralAmount },
        { repayAmount, returnedCollateralAmount },
        addCollateralAmount,
        { liquidateAmount, soldCollateralAmount },
        payDepositDistributorFailedAmount,
        payLoanDistributorFailedAmount,
      ] = await Promise.all([
        getDepositAmount(t.address),
        getWithdrawAmount(t.address),
        getEarlyWithdrawAmount(t.address),
        getInterestForProtocolReserve(t.address),
        getInterestForDistributor(t.address),
        getInterestForLoanDistributor(t.address),
        getLoanAndCollateralAmount(t.address),
        getRepayAndReturnedCollateralAmount(t.address),
        getAddCollateralAmount(t.address),
        getLiquidateAmount(t.address),
        getPayDepositDistributorFailedAmount(t.address),
        getPayLoanDistributorFailedAmount(t.address),
      ]);

      const balance = depositAmount
        .sub(withdrawAmount)
        .sub(interesetForProtocolReserve)
        .sub(interestForDepositDistributor)
        .sub(earlyWithdrawAmount)
        .sub(loanAmount)
        .add(collateralAmount)
        .add(repayAmount)
        .sub(returnedCollateralAmount)
        .add(addCollateralAmount)
        .add(liquidateAmount)
        .sub(soldCollateralAmount)
        .sub(loanDistributorInterest)
        .add(payDepositDistributorFailedAmount)
        .add(payLoanDistributorFailedAmount);

      return { ...t, balance };
    }),
  );

  const factor = new BN('10').pow(new BN('18'));

  for (let r of result) {
    debug(`${r.symbol} Balance: ${r.balance.div(factor)}`); // For better formatting, use ethers.utils.formatUnit
  }

  /**
   * Calc deposited amount
   * @param {string} depositTokenAddress ERC20 contract address
   * @returns {Promise<BN>} Total amount, BN
   */
  function getDepositAmount(depositTokenAddress) {
    return calcAmount('DepositSucceed', { depositTokenAddress });
  }

  /**
   * Calc withdrew amount
   * @param {string} depositTokenAddress
   * @returns {Promise<BN>} Total amount, BN
   */
  function getWithdrawAmount(depositTokenAddress) {
    return calcAmount('WithdrawSucceed', { depositTokenAddress });
  }

  /**
   * Calc early withdrew amount
   * @param {string} depositTokenAddress
   * @returns {Promise<BN>} total amount
   */
  function getEarlyWithdrawAmount(depositTokenAddress) {
    return calcAmount('EarlyWithdrawSucceed', { depositTokenAddress });
  }

  /**
   * Calc interestForProtocolReserve
   * @param {string} depositTokenAddress
   * @returns {Promise<BN>}
   */
  function getInterestForProtocolReserve(depositTokenAddress) {
    return calcAmount(
      'InterestReserveTransfered',
      { depositTokenAddress },
      'interestForProtocolReserve',
    );
  }

  /**
   * Calc interestForDistributor
   * @param {string} depositTokenAddress
   * @returns {Promise<BN>}
   */
  function getInterestForDistributor(depositTokenAddress) {
    return calcAmount(
      'DepositDistributorFeeTransfered',
      { depositTokenAddress },
      'interestForDistributor',
    );
  }

  /**
   * Calc loan Amount
   * @param {string} loanTokenAddress
   */
  async function getLoanAndCollateralAmount(loanTokenAddress) {
    const loanAmount = await calcAmount(
      'LoanSucceed',
      { loanTokenAddress },
      'loanAmount',
    );

    const collateralAmount = await calcAmount(
      'LoanSucceed',
      { collateralTokenAddress: loanTokenAddress },
      'collateralAmount',
    );

    return { loanAmount, collateralAmount };
  }

  /**
   * Calc repay amount
   * @param {string} loanTokenAddress
   */
  async function getRepayAndReturnedCollateralAmount(loanTokenAddress) {
    const repayAmount = await calcAmount(
      'RepayLoanSucceed',
      { loanTokenAddress },
      'repayAmount',
    );

    const returnedCollateralAmount = await calcAmount(
      'RepayLoanSucceed',
      { collateralTokenAddress: loanTokenAddress },
      'returnedCollateralAmount',
    );

    return { repayAmount, returnedCollateralAmount };
  }

  /**
   * Calc AddCollateralAmount
   * @param {string} collateralTokenAddress
   */
  function getAddCollateralAmount(collateralTokenAddress) {
    return calcAmount(
      'AddCollateralSucceed',
      { collateralTokenAddress },
      'collateralAmount',
    );
  }

  /**
   * Calc liquidate amount
   * @param {string} loanTokenAddress
   */
  async function getLiquidateAmount(loanTokenAddress) {
    const liquidateAmount = await calcAmount(
      'LiquidateLoanSucceed',
      { loanTokenAddress },
      'liquidateAmount',
    );

    const soldCollateralAmount = await calcAmount(
      'LiquidateLoanSucceed',
      { collateralTokenAddress: loanTokenAddress },
      'soldCollateralAmount',
    );

    return { liquidateAmount, soldCollateralAmount };
  }

  /**
   * Calc interest for loan distributor
   * @param {string} loanTokenAddress
   */
  function getInterestForLoanDistributor(loanTokenAddress) {
    return calcAmount(
      'LoanDistributorFeeTransfered',
      { loanTokenAddress },
      'interestForLoanDistributor',
    );
  }

  function getPayDepositDistributorFailedAmount(depositTokenAddress) {
    return calcAmount('PayDepositDistributorFailed', { depositTokenAddress });
  }

  function getPayLoanDistributorFailedAmount(loanTokenAddress) {
    return calcAmount('PayLoanDistributorFailed', { loanTokenAddress });
  }

  /**
   * Calc simple amount value
   * @param {string} event ERC20 contract address
   * @param {object} filter Filter object
   * @param {string} valueKey Value key
   * @returns {Promise<BN>} Calculated value
   */
  async function calcAmount(event, filter, valueKey = 'amount') {
    const protocol = await Protocol.at(protocolAddress);

    const events = await protocol.getPastEvents(event, {
      filter: filter,
      fromBlcok: 0,
      toBlock: 'latest',
      topics: null,
    });
    const values = events.map(e => e.returnValues);

    return values
      .map(v => new BN(v[valueKey]))
      .reduce((p, c) => p.add(c), new BN(0));
  }
});
