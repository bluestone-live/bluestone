import { BigNumber } from '../../utils/BigNumber';
import { depositTokenPipe } from './Pipes';
import { IToken, ILoanPair } from '../../stores';
import { EventName, MetaMaskProvider } from '../../utils/MetaMaskProvider';

export class CommonService {
  constructor(private readonly provider: MetaMaskProvider) {}

  /**
   * @returns current network type - 'primary' for local test net
   */
  async getCurrentNetwork(): Promise<string> {
    return this.provider.web3.eth.net.getNetworkType();
  }

  /**
   * TODO: Don't have this method yet
   */
  async getUserActionLock(): Promise<boolean> {
    return this.provider.protocol.methods.getUserActionLock().call();
  }

  async getTokenAllowance(
    accountAddress: string,
    tokenAddress: string,
  ): Promise<BigNumber> {
    return this.provider
      .getERC20ByTokenAddress(tokenAddress)
      .methods.allowance(accountAddress, tokenAddress)
      .call();
  }

  /**
   * @returns available deposit tokens
   */
  async getDepositTokens(): Promise<IToken[]> {
    return depositTokenPipe(
      await this.provider.protocol.methods.getDepositTokens().call(),
      this.provider.getERC20ByTokenAddress,
    );
  }

  async getDepositTerms(): Promise<BigNumber[]> {
    return this.provider.protocol.methods.getDepositTerms().call();
  }

  /**
   * @returns available loan-collateral token pairs
   */
  async getLoanAndCollateralTokenPairs(): Promise<ILoanPair[]> {
    return this.provider.protocol.methods
      .getLoanAndCollateralTokenPairs()
      .call();
  }

  async getLoanTerms(): Promise<BigNumber[]> {
    return this.provider.protocol.methods.getLoanTerms().call();
  }

  /**
   * Get loan interest rate by token
   * @param tokenAddress token address
   * @returns loanTerms: available terms for this token
   * @returns loanInterestRates: loan interest for each term
   */
  async getLoanInterestRateByToken(
    tokenAddress: string,
  ): Promise<{
    loanTerms: BigNumber[];
    loanInterestRates: BigNumber[];
  }> {
    return this.provider.protocol.methods
      .getLoanInterestRateByToken(tokenAddress)
      .call();
  }

  async approveFullAllowance(accountAddress: string, token: IToken) {
    const flow = await this.provider.getContractEventFlow(
      EventName.Approval,
      {
        filter: {
          owner: accountAddress,
          spender: token.tokenAddress,
        },
      },
      token.erc20Instance,
    );

    return flow(async erc20 => {
      erc20.methods.Approval();
      const amount = (await erc20.methods.totalSupply.call()) || 19000;

      return erc20.methods
        .approve(token.tokenAddress, amount.toString())
        .send({ from: accountAddress });
    });
  }
}
