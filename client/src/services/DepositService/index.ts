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

    const isEarlyWithdrawable = await this.provider.protocol.methods
      .isDepositEarlyWithdrawable(depositId)
      .call();

    return depositRecordPipe(record, isEarlyWithdrawable);
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
    depositAmount: string,
    depositTerm: string,
    distributorAddress: string,
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
      returnValues: { recordId },
    } = await flow(async protocol => {
      return protocol.methods
        .deposit(
          tokenAddress,
          depositAmount.toString(),
          depositTerm.toString(),
          distributorAddress,
        )
        .send({ from: accountAddress });
    });

    return recordId;
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
  ): Promise<string> {
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
