import { MetaMaskProvider } from '../../utils/MetaMaskProvider';
import { IDepositRecord, ETHIdentificationAddress } from '../../stores';
import { depositRecordsPipe, depositRecordPipe } from './Pipes';
import { EventData } from 'web3-eth-contract';

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
    const isETHDeposit = tokenAddress === ETHIdentificationAddress;

    const {
      events: {
        DepositSucceed: {
          returnValues: { recordId },
        },
      },
    } = await this.provider.protocol.methods
      .deposit(
        tokenAddress,
        isETHDeposit ? '0' : depositAmount.toString(),
        depositTerm.toString(),
        distributorAddress,
      )
      .send({
        from: accountAddress,
        value: isETHDeposit ? depositAmount : undefined,
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
  ): Promise<EventData> {
    const {
      events: {
        WithdrawSucceed: { returnValues },
      },
    } = await this.provider.protocol.methods
      .withdraw(depositId)
      .send({ from: accountAddress });

    return returnValues;
  }

  /**
   * Early withdraw deposit
   * @param accountAddress account address
   * @param depositId deposit id
   */
  async earlyWithdrawDeposit(
    accountAddress: string,
    depositId: string,
  ): Promise<EventData> {
    const {
      events: {
        EarlyWithdrawSucceed: { returnValues },
      },
    } = await this.provider.protocol.methods
      .earlyWithdraw(depositId)
      .send({ from: accountAddress });

    return returnValues;
  }
}
