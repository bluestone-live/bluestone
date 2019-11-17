import { BigNumber, convertDecimalToWei } from '../../utils/BigNumber';
import { MetaMaskProvider, EventName } from '../../utils/MetaMaskProvider';
import { IDepositRecord, RecordType } from '../../stores';
import { depositRecordsPipe } from './Pipes';

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
    const {
      tokenAddress,
      depositTerm,
      depositAmount,
      poolId,
      createdAt,
      maturedAt,
      withdrewAt,
      isMatured,
      isWithdrawn,
    } = await this.provider.protocol.methods
      .getDepositRecordById(depositId)
      .call();
    const interest = await this.provider.protocol.methods
      .getDepositInterestById(depositId)
      .call();
    const isEarlyWithdrawable = await this.provider.protocol.methods
      .isDepositEarlyWithdrawable(depositId)
      .call();
    return {
      recordId: depositId,
      tokenAddress,
      depositTerm,
      depositAmount,
      poolId,
      createdAt,
      maturedAt,
      withdrewAt,
      isMatured,
      isWithdrawn,
      interest,
      isEarlyWithdrawable,
      recordType: RecordType.Deposit,
    };
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
          '0x3dd5A7c19C2226961dF1f97644ab0c6Dd8d2Daa8',
          convertDecimalToWei(0.01).toString(),
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
      .withdrawDeposit(depositId)
      .send({ from: accountAddress });
  }

  /**
   * Early withdraw deposit
   * @param accountAddress account address
   * @param depositId deposit id
   */
  async earlyWithdrawDeposit(accountAddress: string, depositId: string) {
    return this.provider.protocol.methods
      .earlyWithdrawDeposit(depositId)
      .send({ from: accountAddress });
  }
}
