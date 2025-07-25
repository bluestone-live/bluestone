import { IToken, ILoanPair, ETHIdentificationAddress } from '../../stores';
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
        erc20Instance:
          tokenAddress === ETHIdentificationAddress
            ? undefined
            : getERC20ByTokenAddress(tokenAddress),
      }))
      .map(async ({ tokenAddress, erc20Instance }) => ({
        tokenAddress,
        erc20Instance,
        decimals: erc20Instance
          ? await erc20Instance!.methods.decimals().call()
          : '18',
        tokenSymbol:
          tokenAddress === ETHIdentificationAddress
            ? 'ETH'
            : ((await erc20Instance!.methods.symbol().call()) as string),
      })),
  );
};

interface IGetLoanAndCollateralTokenPairsResult {
  loanTokenAddress: string;
  collateralTokenAddress: string;
  minCollateralCoverageRatio: string;
  liquidationDiscount: string;
}

export const loanPairPipe = async (
  resultSet: IGetLoanAndCollateralTokenPairsResult[],
  getERC20ByTokenAddress: ERC20Factory,
): Promise<ILoanPair[]> => {
  return Promise.all(
    resultSet
      .filter(
        loanPair => Number.parseFloat(loanPair.minCollateralCoverageRatio) > 0,
      )
      .map(
        ({
          loanTokenAddress,
          collateralTokenAddress,
          minCollateralCoverageRatio,
        }) => ({
          loanToken: {
            tokenAddress: loanTokenAddress,
            decimals: '18',
            erc20Instance:
              loanTokenAddress === ETHIdentificationAddress
                ? undefined
                : getERC20ByTokenAddress(loanTokenAddress),
          },
          collateralToken: {
            tokenAddress: collateralTokenAddress,
            decimals: '18',
            erc20Instance:
              collateralTokenAddress === ETHIdentificationAddress
                ? undefined
                : getERC20ByTokenAddress(collateralTokenAddress),
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
            decimals:
              loanToken.tokenAddress === ETHIdentificationAddress
                ? '18'
                : await loanToken.erc20Instance!.methods.decimals().call(),
            tokenSymbol:
              loanToken.tokenAddress === ETHIdentificationAddress
                ? 'ETH'
                : ((await loanToken
                    .erc20Instance!.methods.symbol()
                    .call()) as string),
          },
          collateralToken: {
            ...collateralToken,
            tokenSymbol: (collateralToken.tokenAddress ===
            ETHIdentificationAddress
              ? 'ETH'
              : await collateralToken
                  .erc20Instance!.methods.symbol()
                  .call()) as string,
          },
          minCollateralCoverageRatio,
          annualPercentageRate,
        }),
      ),
  );
};
