import { BigNumber } from '../../utils/BigNumber';
import { EventName, MetaMaskProvider } from '../../utils/MetaMaskProvider';
import { IAvailableCollateral } from '../../stores';
import { availableCollateralPipe } from './Pipes';

export class AccountService {
  constructor(private readonly provider: MetaMaskProvider) {}

  /**
   * Get all accounts
   * @returns A list of accounts in MetaMask
   */
  async getAccounts(): Promise<string[]> {
    return this.provider.web3.eth.getAccounts();
  }
  /**
   * Get general statistics by account address
   * @param accountAddress account address
   * @param key statistic key
   * @returns statistics value
   */
  async getGeneralStat(
    accountAddress: string,
    key: string,
  ): Promise<BigNumber> {
    return this.provider.protocol.methods
      .getAccountGeneralStat(accountAddress, key)
      .call();
  }

  /**
   * Get statistics by account and token address
   * @param accountAddress account address
   * @param tokenAddress token address
   * @param key statistic key
   * @returns statistics value
   */
  async getTokenStat(
    accountAddress: string,
    tokenAddress: string,
    key: string,
  ): Promise<BigNumber> {
    return this.provider.protocol.methods
      .getAccountTokenStat(accountAddress, tokenAddress, key)
      .call();
  }

  /**
   * Get available collateral amount per token
   * @param accountAddress account address
   * @returns tokenAddressList: all available collateral token address
   * @returns availableCollateralAmountList: available collateral amount of each token
   */
  async getAvailableCollaterals(
    accountAddress: string,
  ): Promise<IAvailableCollateral[]> {
    return availableCollateralPipe(
      this.provider.protocol.methods
        .getAvailableCollateralsByAccount(accountAddress)
        .call(),
    );
  }

  /**
   * Withdraw available collateral
   * @param accountAddress Account address
   * @param tokenAddress The token user want to withdraw
   * @param collateralAmount withdraw amount
   */
  async withdrawAvailableCollateral(
    accountAddress: string,
    tokenAddress: string,
    collateralAmount: BigNumber,
  ) {
    const flow = await this.provider.getContractEventFlow(
      EventName.WithdrawAvailableCollateralSuccessful,
      {
        filter: { user: accountAddress },
      },
    );
    return flow(protocol =>
      protocol.methods
        .withdrawAvailableCollateral(tokenAddress, collateralAmount)
        .send({ from: accountAddress }),
    );
  }
}
