import { nonDeployedContractJsonInterface, web3 } from './Web3Service';
import { tokenStore } from '..';
import {
  RecordType,
  ILoanRecord,
  getLoanRecordStatus,
} from '../../constants/Record';
import { convertWeiToDecimal } from '../../utils/BigNumber';
import { formatSolidityTime } from '../../utils/formatSolidityTime';
import { ITerm } from '../../constants/Term';

export const getLoan = async (
  loanAddress: string,
  terms: ITerm[],
): Promise<ILoanRecord | null> => {
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
    recordAddress: loanAddress,
    owner: await loanContractInstance.methods.owner().call(),
    type: RecordType.Loan,
    status: await getLoanRecordStatus(
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
    interest: convertWeiToDecimal(
      await loanContractInstance.methods.interest().call(),
    ),
    createdAt: formatSolidityTime(
      await loanContractInstance.methods.createdAt().call(),
    ),
    remainingDebt: convertWeiToDecimal(
      await loanContractInstance.methods.remainingDebt().call(),
    ),
  };
};
