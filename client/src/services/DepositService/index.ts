import { BigNumber } from '../../utils/BigNumber';
import { IProtocolDepositRecord } from '..';
import { MetaMaskProvider } from '../../utils/MetaMaskProvider';

export class DepositService {
  constructor(private readonly provider: MetaMaskProvider) {}

  /**
   * Get deposit records by account
   * @param accountAddress account address
   * @returns deposit records list with necessary information
   */
  async getDepositRecordsByAccount(
    accountAddress: string,
  ): Promise<IProtocolDepositRecord[]> {
    return this.provider.protocol.methods
      .getDepositRecordsByAccount(accountAddress)
      .call();
  }

  /**
   * Get deposit detail by ID
   * @param depositId deposit id
   * @returns deposit detail information
   */
  async getDepositRecordById(
    depositId: string,
  ): Promise<IProtocolDepositRecord> {
    return this.provider.protocol.methods
      .getDepositRecordById(depositId)
      .call();
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
    return this.provider.protocol.methods
      .deposit(tokenAddress, depositAmount, depositTerm)
      .send({ from: accountAddress });
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
}
