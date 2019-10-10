import { IToken } from '../../_stores';
import { ERC20Factory } from '../../utils/MetaMaskProvider';

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
  if (depositTokenAddressList.length !== isEnabledList.length) {
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
        tokenSymbol: (await erc20Instance.methods.symbol()) as string,
      })),
  );
};
