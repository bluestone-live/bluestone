import { BigNumber } from '../../utils/BigNumber';
import { MetaMaskProvider, EventName } from '../../utils/MetaMaskProvider';
import { loanRecordsPipe, loanRecordPipe } from './Pipes';
import { ILoanRecord } from '../../stores';

export class LoanService {
  constructor(private readonly provider: MetaMaskProvider) {}

  /**
   * Get loan records by account
   * @param accountAddress account address
   * @returns loan records list with necessary information
   */
  async getLoanRecordsByAccount(
    accountAddress: string,
  ): Promise<ILoanRecord[]> {
    return loanRecordsPipe(
      await this.provider.protocol.methods
        .getLoanRecordsByAccount(accountAddress)
        .call(),
    );
  }

  /**
   * Get loan detail by ID
   * @param recordId loan id
   * @returns loan detail information
   */
  async getLoanRecordById(recordId: string): Promise<ILoanRecord> {
    return loanRecordPipe(
      recordId,
      await this.provider.protocol.methods.getLoanRecordById(recordId).call(),
      await this.provider.protocol.methods
        .getLoanRecordDetailsById(recordId)
        .call(),
    );
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
    distributorAddress: string,
  ): Promise<string> {
    const flow = await this.provider.getContractEventFlow(
      EventName.LoanSucceed,
      {
        filter: {
          accountAddress,
        },
      },
    );
    const {
      returnValues: { loanId },
    } = await flow(async protocol => {
      protocol.methods
        .loan(
          loanTokenAddress,
          collateralTokenAddress,
          loanAmount.toString(),
          collateralAmount.toString(),
          loanTerm.toString(),
          useAvailableCollateral,
          distributorAddress,
        )
        .send({ from: accountAddress });
    });
    return loanId;
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
