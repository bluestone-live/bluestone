import { depositTokenPipe, loanPairPipe } from './Pipes';
import { IToken, ILoanPair, IInterestModelParameters } from '../../stores';
import { EventName, MetaMaskProvider } from '../../utils/MetaMaskProvider';

export class CommonService {
  constructor(private readonly provider: MetaMaskProvider) {}

  /**
   * @returns current network type - 'primary' for local test net
   */
  async getCurrentNetwork(): Promise<string> {
    return this.provider.network;
  }

  async enableEthereumNetwork() {
    return this.provider.enableEthereumNetwork();
  }

  async bindEthereumStateChangeEvent(
    onAccountChanged: (...args: any[]) => any,
  ) {
    return this.provider.bindEthereumStateChangeEvent(onAccountChanged);
  }

  /**
   * @returns protocol contract address
   */
  async getProtocolContractAddress(): Promise<string> {
    return this.provider.protocolContractAddress;
  }

  /**
   * Get Allowance for each token
   * @param token IToken instance
   * @param accountAddress user account address
   * @param protocolContractAddress protocol contract address
   * @returns Allowance values
   */
  async getTokenAllowance(
    token: IToken,
    accountAddress: string,
    protocolContractAddress: string,
  ): Promise<string> {
    return token
      .erc20Instance!.methods.allowance(accountAddress, protocolContractAddress)
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

  async getDepositTerms(): Promise<string[]> {
    return this.provider.protocol.methods.getDepositTerms().call();
  }

  /**
   * @returns available loan-collateral token pairs
   */
  async getLoanAndCollateralTokenPairs(): Promise<ILoanPair[]> {
    return loanPairPipe(
      await this.provider.protocol.methods
        .getLoanAndCollateralTokenPairs()
        .call(),
      this.provider.getERC20ByTokenAddress,
    );
  }

  async getMaxLoanTerm(): Promise<string> {
    return this.provider.protocol.methods.getMaxLoanTerm().call();
  }

  /**
   * Get loan interest rate by token
   * @param tokenAddress token address
   * @returns loanTerms: available terms for this token
   * @returns loanInterestRates: loan interest for each term
   */
  async getLoanInterestRate(
    tokenAddress: string,
    maxLoanTerm: string,
  ): Promise<string> {
    return this.provider.protocol.methods
      .getLoanInterestRate(tokenAddress, maxLoanTerm)
      .call();
  }

  /**
   * Get price by token address
   * @param tokenAddress token address
   */
  async getPrice(tokenAddress: string): Promise<string> {
    return this.provider.protocol.methods.getTokenPrice(tokenAddress).call();
  }

  async approveFullAllowance(
    accountAddress: string,
    token: IToken,
    protocolContractAddress: string,
  ) {
    const flow = await this.provider.getContractEventFlow(
      EventName.Approval,
      {
        filter: {
          owner: accountAddress,
          spender: protocolContractAddress,
        },
      },
      token.erc20Instance,
    );
    return flow(async erc20 => {
      const amount = (await erc20.methods.totalSupply().call()) || 19000;

      return erc20.methods
        .approve(protocolContractAddress, amount)
        .send({ from: accountAddress });
    });
  }

  /**
   * Get interest reserve address
   */
  async getInterestReserveAddress(): Promise<string> {
    return this.provider.protocol.methods.getInterestReserveAddress().call();
  }

  /**
   * Get interest model parameters
   * @param tokenAddress token address
   */
  async getInterestModelParameters(
    tokenAddress: string,
  ): Promise<IInterestModelParameters> {
    return this.provider.interestModel.methods
      .getLoanParameters(tokenAddress)
      .call();
  }
}
