import { nonDeployedContractJsonInterface, web3 } from './Web3Service';
import { tokenStore } from '..';
import {
  RecordType,
  getDepositRecordStatus,
  IDepositRecord,
} from '../../constants/Record';
import { convertWeiToDecimal } from '../../utils/BigNumber';
import { formatSolidityTime } from '../../utils/formatSolidityTime';
import { ITerm } from '../../constants/Term';

export const getDeposit = async (
  depositAddress: string,
  terms: ITerm[],
): Promise<IDepositRecord | null> => {
  const depositContractInstance = new web3.eth.Contract(
    nonDeployedContractJsonInterface.Deposit.abi,
    depositAddress,
  );
  const tokenAddress = await depositContractInstance.methods.asset().call();
  const termValue = await depositContractInstance.methods.term().call();
  const token = tokenStore.getTokenByAddress(tokenAddress);
  const term = terms.find(t => t.value === termValue);
  if (!token || !term) {
    // throw new Error(`invalid data: ${depositAddress}`);
    return null;
  }
  return {
    recordAddress: depositAddress,
    owner: await depositContractInstance.methods.owner().call(),
    type: RecordType.Deposit,
    status: await getDepositRecordStatus(depositContractInstance),
    token,
    term,
    depositAmount: convertWeiToDecimal(
      await depositContractInstance.methods.amount().call(),
    ),
    withdrewAmount: convertWeiToDecimal(
      await depositContractInstance.methods.withdrewAmount().call(),
    ),
    createdAt: formatSolidityTime(
      await depositContractInstance.methods.createdAt().call(),
    ),
    maturedAt: formatSolidityTime(
      await depositContractInstance.methods.maturedAt().call(),
    ),
    contract: depositContractInstance,
  };
};
