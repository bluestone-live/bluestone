import { BigNumber, convertDecimalToWei } from '../../utils/BigNumber';
import { MetaMaskProvider, EventName } from '../../utils/MetaMaskProvider';
import { IDepositRecord } from '../../stores';
import { depositRecordsPipe, depositRecordPipe } from './Pipes';

export class DepositService {
  constructor(private readonly provider: MetaMaskProvider) {}

  /**
   * Get deposit records by account
   * @param accountAddress account address
   * @returns deposit records list with necessary information
   */
  async getDepositRecordsByAccount(
    accountAddress: string,
  ): Promise<IDepositRecord[]> {
    return depositRecordsPipe(
      await this.provider.protocol.methods
        .getDepositRecordsByAccount(accountAddress)
        .call(),
    );
  }

  /**
   * Get deposit detail by ID
   * @param depositId deposit id
   * @returns deposit detail information
   */
  async getDepositRecordById(depositId: string): Promise<IDepositRecord> {
    const record = await this.provider.protocol.methods
      .getDepositRecordById(depositId)
      .call();

    const interest = record.isClosed
      ? await this.provider.protocol.methods
          .getDepositInterestById(depositId)
          .call()
      : new BigNumber(0);
    const isEarlyWithdrawable = await this.provider.protocol.methods
      .isDepositEarlyWithdrawable(depositId)
      .call();

    return depositRecordPipe(depositId, record, interest, isEarlyWithdrawable);
  }

  /**
   * Create a new deposit
   * @param accountAddress account address
   * @param tokenAddress deposit token address
   * @param depositAmount deposit amount
   * @param depositTerm deposit term
   * @returns deposit id
   */
  async deposit(
    accountAddress: string,
    tokenAddress: string,
    depositAmount: BigNumber,
    depositTerm: BigNumber,
    distributorAddress: string,
    depositDistributorFeeRatio: number,
  ): Promise<string> {
    const flow = await this.provider.getContractEventFlow(
      EventName.DepositSucceed,
      {
        filter: {
          accountAddress,
        },
      },
    );
    const {
      returnValues: { depositId },
    } = await flow(async protocol => {
      return protocol.methods
        .deposit(
          tokenAddress,
          depositAmount.toString(),
          depositTerm.toString(),
          distributorAddress,
          convertDecimalToWei(depositDistributorFeeRatio).toString(),
        )
        .send({ from: accountAddress });
    });

    return depositId;
  }

  /**
   * Withdraw deposit
   * @param accountAddress account address
   * @param depositId deposit id
   * @returns withdrew amount (include interest)
   */
  async withdrawDeposit(
    accountAddress: string,
    depositId: string,
  ): Promise<BigNumber> {
    return this.provider.protocol.methods
      .withdraw(depositId)
      .send({ from: accountAddress });
  }

  /**
   * Early withdraw deposit
   * @param accountAddress account address
   * @param depositId deposit id
   */
  async earlyWithdrawDeposit(accountAddress: string, depositId: string) {
    return this.provider.protocol.methods
      .earlyWithdraw(depositId)
      .send({ from: accountAddress });
  }
}
