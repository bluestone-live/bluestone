import { MetaMaskProvider } from '../../utils/MetaMaskProvider';
import { loanRecordsPipe } from './Pipes';
import { ILoanRecord, ETHIdentificationAddress } from '../../stores';

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
    return loanRecordsPipe([
      await this.provider.protocol.methods.getLoanRecordById(recordId).call(),
    ])[0];
  }

  /**
   * @returns loanId
   */
  async loan(
    accountAddress: string,
    loanTokenAddress: string,
    collateralTokenAddress: string,
    loanAmount: string,
    collateralAmount: string,
    loanTerm: number,
    distributorAddress: string,
  ): Promise<string> {
    const isEtherCollateral =
      collateralTokenAddress === ETHIdentificationAddress;

    const {
      events: {
        LoanSucceed: {
          returnValues: { recordId },
        },
      },
    } = await this.provider.protocol.methods
      .loan(
        loanTokenAddress,
        collateralTokenAddress,
        loanAmount.toString(),
        isEtherCollateral ? '0' : collateralAmount.toString(),
        loanTerm.toString(),
        distributorAddress,
      )
      .send({
        from: accountAddress,
        value: isEtherCollateral ? collateralAmount : undefined,
      });

    return recordId;
  }

  /**
   * @returns remainingDebt remaining debt of this loan
   */
  async repayLoan(
    accountAddress: string,
    loanId: string,
    repayAmount: string,
    loanTokenAddress: string,
  ) {
    const {
      events: {
        RepayLoanSucceed: { returnValues },
      },
    } = await this.provider.protocol.methods
      .repayLoan(loanId, repayAmount.toString())
      .send({
        from: accountAddress,
        value: loanTokenAddress === ETHIdentificationAddress ? repayAmount : 0,
      });

    return returnValues;
  }

  async addCollateral(
    accountAddress: string,
    loanId: string,
    collateralTokenAddress: string,
    collateralAmount: string,
  ) {
    const isEtherCollateral =
      collateralTokenAddress === ETHIdentificationAddress;

    const {
      events: {
        AddCollateralSucceed: { returnValues },
      },
    } = await this.provider.protocol.methods
      .addCollateral(
        loanId,
        isEtherCollateral ? '0' : collateralAmount.toString(),
      )
      .send({
        from: accountAddress,
        value: isEtherCollateral ? collateralAmount.toString() : undefined,
      });

    return returnValues;
  }

  async removeCollateral(
    accountAddress: string,
    loanId: string,
    collateralAmount: string,
  ) {
    const {
      events: {
        SubtractCollateralSucceed: { returnValues },
      },
    } = await this.provider.protocol.methods
      .subtractCollateral(loanId, collateralAmount.toString())
      .send({
        from: accountAddress,
        value: '0',
      });

    return returnValues;
  }
}
