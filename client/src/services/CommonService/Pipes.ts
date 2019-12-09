import { IToken, ILoanPair } from '../../stores';
import { ERC20Factory } from '../../utils/MetaMaskProvider';
import { BigNumber } from '../../utils/BigNumber';
import { isAllEqual } from '../../utils/isAllEqual';

interface IGetDepositTokensResultSet {
  depositTokenAddressList: string[];
  isEnabledList: boolean[];
}

/**
 * [depositTokenAddress[], isEnabled[]] -> IToken[]
 * @param depositTokenResultSet: Tuple data from contract
 * @param getERC20ByTokenAddress: A factory to get ERC20 instance by contract address
 */
export const depositTokenPipe = async (
  { depositTokenAddressList, isEnabledList }: IGetDepositTokensResultSet,
  getERC20ByTokenAddress: ERC20Factory,
): Promise<IToken[]> => {
  if (isAllEqual(depositTokenAddressList.length, isEnabledList.length)) {
    throw new Error('Client: Data length dose not match.');
  }

  return Promise.all(
    depositTokenAddressList
      .filter((_, index: number) => isEnabledList[index])
      .map((tokenAddress: string) => ({
        tokenAddress,
        erc20Instance: getERC20ByTokenAddress(tokenAddress),
      }))
      .map(async ({ tokenAddress, erc20Instance }) => ({
        tokenAddress,
        erc20Instance,
        tokenSymbol: (await erc20Instance.methods.symbol.call()) as string,
      })),
  );
};

interface IGetLoanAndCollateralTokenPairsResultSet {
  loanTokenAddressList: string[];
  collateralTokenAddressList: string[];
  isEnabledList: string[];
  minCollateralCoverageRatioList: BigNumber[];
  liquidationDiscountList: BigNumber[];
}

export const loanPairPipe = async (
  {
    loanTokenAddressList,
    collateralTokenAddressList,
    isEnabledList,
    minCollateralCoverageRatioList,
    liquidationDiscountList,
  }: IGetLoanAndCollateralTokenPairsResultSet,
  getERC20ByTokenAddress: ERC20Factory,
): Promise<ILoanPair[]> => {
  if (
    isAllEqual(
      loanTokenAddressList.length * collateralTokenAddressList.length,
      isEnabledList.length,
      minCollateralCoverageRatioList.length,
      liquidationDiscountList.length,
    )
  ) {
    throw new Error('Client: Data length dose not match.');
  }
  return Promise.all(
    loanTokenAddressList
      .reduce<
        Array<{
          loanTokenAddress: string;
          collateralTokenAddress: string;
        }>
      >((loanPairs, loanTokenAddress) => {
        return [
          ...loanPairs,
          ...collateralTokenAddressList.map(collateralTokenAddress => ({
            loanTokenAddress,
            collateralTokenAddress,
          })),
        ];
      }, [])
      .map((loanPair, index: number) => ({
        ...loanPair,
        minCollateralCoverageRatio: minCollateralCoverageRatioList[index],
      }))
      .filter((_, index: number) => isEnabledList[index])
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
          annualPercentageRate: new BigNumber(0),
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
            tokenSymbol: (await loanToken.erc20Instance.methods.symbol.call()) as string,
          },
          collateralToken: {
            ...collateralToken,
            tokenSymbol: (await collateralToken.erc20Instance.methods.symbol.call()) as string,
          },
          minCollateralCoverageRatio,
          annualPercentageRate,
        }),
      ),
  );
};
