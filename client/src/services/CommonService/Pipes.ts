import { IToken, ILoanPair } from '../../stores';
import { ERC20Factory } from '../../utils/MetaMaskProvider';

/**
 * [depositTokenAddress[], isEnabled[]] -> IToken[]
 * @param depositTokenResultSet: Tuple data from contract
 * @param getERC20ByTokenAddress: A factory to get ERC20 instance by contract address
 */
export const depositTokenPipe = async (
  depositTokenAddressList: string[],
  getERC20ByTokenAddress: ERC20Factory,
): Promise<IToken[]> => {
  return Promise.all(
    depositTokenAddressList
      .map((tokenAddress: string) => ({
        tokenAddress,
        erc20Instance: getERC20ByTokenAddress(tokenAddress),
      }))
      .map(async ({ tokenAddress, erc20Instance }) => ({
        tokenAddress,
        erc20Instance,
        tokenSymbol: (await erc20Instance.methods.symbol().call()) as string,
      })),
  );
};

interface IGetLoanAndCollateralTokenPairsResult {
  loanTokenAddress: string;
  collateralTokenAddress: string;
  isEnabled: boolean;
  minCollateralCoverageRatio: string;
  liquidationDiscount: string;
}

export const loanPairPipe = async (
  resultSet: IGetLoanAndCollateralTokenPairsResult[],
  getERC20ByTokenAddress: ERC20Factory,
): Promise<ILoanPair[]> => {
  return Promise.all(
    resultSet
      .filter(loanPair => loanPair.isEnabled)
      .map(
        ({
          loanTokenAddress,
          collateralTokenAddress,
          minCollateralCoverageRatio,
        }) => ({
          loanToken: {
            tokenAddress: loanTokenAddress,
            erc20Instance: getERC20ByTokenAddress(loanTokenAddress),
          },
          collateralToken: {
            tokenAddress: collateralTokenAddress,
            erc20Instance: getERC20ByTokenAddress(collateralTokenAddress),
          },
          minCollateralCoverageRatio,
          annualPercentageRate: '0',
        }),
      )
      .map(
        async ({
          loanToken,
          collateralToken,
          annualPercentageRate,
          minCollateralCoverageRatio,
        }) => ({
          loanToken: {
            ...loanToken,
            tokenSymbol: (await loanToken.erc20Instance.methods
              .symbol()
              .call()) as string,
          },
          collateralToken: {
            ...collateralToken,
            tokenSymbol: (await collateralToken.erc20Instance.methods
              .symbol()
              .call()) as string,
          },
          minCollateralCoverageRatio,
          annualPercentageRate,
        }),
      ),
  );
};
