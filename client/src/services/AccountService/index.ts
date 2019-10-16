import { BigNumber } from '../../utils/BigNumber';
import { EventName, MetaMaskProvider } from '../../utils/MetaMaskProvider';
import { IFreedCollateral } from '../../_stores';
import { freedCollateralPipe } from './Pipes';

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
   * Get freed collateral amount per token
   * @param accountAddress account address
   * @returns tokenAddressList: all available collateral token address
   * @returns freedCollateralAmountList: freed collateral amount of each token
   */
  async getFreedCollaterals(
    accountAddress: string,
  ): Promise<IFreedCollateral[]> {
    return freedCollateralPipe(
      this.provider.protocol.methods
        .getFreedCollateralsByAccount(accountAddress)
        .call(),
    );
  }

  /**
   * Withdraw freed collateral
   * @param accountAddress Account address
   * @param tokenAddress The token user want to withdraw
   * @param collateralAmount withdraw amount
   */
  async withdrawFreedCollateral(
    accountAddress: string,
    tokenAddress: string,
    collateralAmount: BigNumber,
  ) {
    const flow = await this.provider.getContractEventFlow(
      EventName.WithdrawFreedCollateralSuccessful,
      {
        filter: { user: accountAddress },
      },
    );
    return flow(protocol =>
      protocol.methods
        .withdrawFreedCollateral(tokenAddress, collateralAmount)
        .send({ from: accountAddress }),
    );
  }
}
