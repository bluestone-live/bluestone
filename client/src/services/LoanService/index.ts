import { IProtocolLoanRecord } from '..';
import { BigNumber } from '../../utils/BigNumber';
import { MetaMaskProvider } from '../../utils/MetaMaskProvider';

export class LoanService {
  constructor(private readonly provider: MetaMaskProvider) {}

  /**
   * Get loan records by account
   * @param accountAddress account address
   * @returns loan records list with necessary information
   */
  async getLoanRecordsByAccount(
    accountAddress: string,
  ): Promise<IProtocolLoanRecord[]> {
    return this.provider.protocol.methods
      .getLoanRecordsByAccount(accountAddress)
      .call();
  }

  /**
   * Get loan detail by ID
   * @param loanId loan id
   * @returns loan detail information
   */
  async getLoanRecordById(loanId: string): Promise<IProtocolLoanRecord> {
    return this.provider.protocol.methods.getLoanRecordById(loanId).call();
  }

  /**
   * @returns loanId
   */
  async loan(
    accountAddress: string,
    loanTokenAddress: string,
    collateralTokenAddress: string,
    loanAmount: BigNumber,
    collateralAmount: BigNumber,
    loanTerm: BigNumber,
    useAvailableCollateral: boolean,
  ): Promise<string> {
    return this.provider.protocol.methods
      .loan(
        loanTokenAddress,
        collateralTokenAddress,
        loanAmount,
        collateralAmount,
        loanTerm,
        useAvailableCollateral,
      )
      .send({ from: accountAddress });
  }

  /**
   * @returns remainingDebt remaining debt of this loan
   */
  async repayLoan(
    accountAddress: string,
    loanId: string,
    repayAmount: BigNumber,
  ): Promise<BigNumber> {
    return this.provider.protocol.methods
      .repayLoan(loanId, repayAmount)
      .send({ from: accountAddress });
  }
  async addCollateral(
    accountAddress: string,
    loanId: string,
    collateralAmount: BigNumber,
    useAvailableCollateral: boolean,
  ): Promise<BigNumber> {
    return this.provider.protocol.methods
      .addCollateral(loanId, collateralAmount, useAvailableCollateral)
      .send({ from: accountAddress });
  }
}
