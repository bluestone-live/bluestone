import { MetaMaskProvider } from '../../utils/MetaMaskProvider';
import { IToken } from '../../stores';

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
   *
   * @param accountAddress account address
   * @param token IToken instance
   * @returns Token balance of account address
   */
  async getTokenBalance(
    accountAddress: string,
    token: IToken,
  ): Promise<string> {
    return token.erc20Instance.methods.balanceOf(accountAddress).call();
  }

  /**
   * Get general statistics by account address
   * @param accountAddress account address
   * @param key statistic key
   * @returns statistics value
   */
  async getGeneralStat(accountAddress: string, key: string): Promise<string> {
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
  ): Promise<string> {
    return this.provider.protocol.methods
      .getAccountTokenStat(accountAddress, tokenAddress, key)
      .call();
  }
}
