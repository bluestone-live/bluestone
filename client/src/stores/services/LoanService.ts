import { nonDeployedContractJsonInterface, web3 } from './Web3Service';
import { tokenStore } from '..';
import { terms } from '../../constants/Term';
import {
  TransactionType,
  ILoanTransaction,
  getLoanTransactionStatus,
} from '../../constants/Transaction';
import { convertWeiToDecimal } from '../../utils/BigNumber';
import { formatSolidityTime } from '../../utils/formatSolidityTime';

export const getLoan = async (
  loanAddress: string,
): Promise<ILoanTransaction | null> => {
  const loanContractInstance = new web3.eth.Contract(
    nonDeployedContractJsonInterface.Loan.abi,
    loanAddress,
  );
  const loanTokenAddress = await loanContractInstance.methods
    .loanAsset()
    .call();
  const collateralTokenAddress = await loanContractInstance.methods
    .collateralAsset()
    .call();
  const termValue = await loanContractInstance.methods.term().call();
  const loanToken = tokenStore.getTokenByAddress(loanTokenAddress);
  const collateralToken = tokenStore.getTokenByAddress(collateralTokenAddress);
  const term = terms.find(t => t.value === termValue);
  if (!loanToken || !collateralToken || !term) {
    // throw new Error(`invalid data: ${depositAddress}`);
    return null;
  }

  return {
    transactionAddress: loanAddress,
    owner: await loanContractInstance.methods.owner().call(),
    type: TransactionType.Loan,
    status: await getLoanTransactionStatus(
      loanContractInstance,
      loanToken,
      collateralToken,
    ),
    loanToken,
    collateralToken,
    term,
    loanAmount: convertWeiToDecimal(
      await loanContractInstance.methods.loanAmount().call(),
    ),
    collateralAmount: convertWeiToDecimal(
      await loanContractInstance.methods.collateralAmount().call(),
    ),
    alreadyPaidAmount: convertWeiToDecimal(
      await loanContractInstance.methods.alreadyPaidAmount().call(),
    ),
    liquidatedAmount: convertWeiToDecimal(
      await loanContractInstance.methods.liquidatedAmount().call(),
    ),
    soldCollateralAmount: convertWeiToDecimal(
      await loanContractInstance.methods.soldCollateralAmount().call(),
    ),
    accruedInterest: convertWeiToDecimal(
      await loanContractInstance.methods.accruedInterest().call(),
    ),
    createdAt: formatSolidityTime(
      await loanContractInstance.methods.createdAt().call(),
    ),
    remainingDebt: convertWeiToDecimal(
      await loanContractInstance.methods.remainingDebt().call(),
    ),
  };
};
