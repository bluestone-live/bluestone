import { MetaMaskProvider, EventName } from '../../utils/MetaMaskProvider';
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
      if (collateralTokenAddress === ETHIdentificationAddress) {
        return protocol.methods
          .loan(
            loanTokenAddress,
            collateralTokenAddress,
            loanAmount.toString(),
            '0',
            loanTerm.toString(),
            distributorAddress,
          )
          .send({ from: accountAddress, value: loanAmount });
      }
      return protocol.methods
        .loan(
          loanTokenAddress,
          collateralTokenAddress,
          loanAmount.toString(),
          collateralAmount.toString(),
          loanTerm.toString(),
          distributorAddress,
        )
        .send({ from: accountAddress });
    });
    return loanId;
  }

  /**
   * @returns remainingDebt remaining debt of this loan
   */
  async repayLoan(accountAddress: string, loanId: string, repayAmount: string) {
    const flow = await this.provider.getContractEventFlow(
      EventName.RepayLoanSucceed,
      {
        filter: {
          accountAddress,
        },
      },
    );
    return flow(protocol => {
      return protocol.methods
        .repayLoan(loanId, repayAmount.toString())
        .send({ from: accountAddress });
    });
  }

  async addCollateral(
    accountAddress: string,
    loanId: string,
    collateralTokenAddress: string,
    collateralAmount: string,
  ) {
    const flow = await this.provider.getContractEventFlow(
      EventName.AddCollateralSucceed,
      {
        filter: {
          accountAddress,
        },
      },
    );
    return flow(protocol => {
      if (collateralTokenAddress === ETHIdentificationAddress) {
        return protocol.methods
          .addCollateral(loanId, '0')
          .send({ from: accountAddress, value: collateralAmount.toString() });
      }
      return protocol.methods
        .addCollateral(loanId, collateralAmount.toString())
        .send({ from: accountAddress });
    });
  }

  async getLoanInterestRate(loanTokenAddress: string, term: number) {
    return this.provider.protocol.methods
      .getLoanInterestRate(loanTokenAddress, term.toString())
      .call();
  }
}
