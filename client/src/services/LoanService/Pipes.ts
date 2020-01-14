import { RecordType, ILoanRecord } from '../../stores';
import { formatSolidityTime } from '../../utils/formatSolidityTime';
import dayjs from 'dayjs';
import { getTermObjectByValue } from '../../utils/getTermObjectByValue';

interface IGetLoanRecordResponse {
  isClosed: boolean;
  loanId: string;
  loanTokenAddress: string;
  collateralTokenAddress: string;
  loanAmount: string;
  collateralAmount: string;
  loanTerm: string;
  annualInterestRate: string;
  interest: string;
  minCollateralCoverageRatio: string;
  alreadyPaidAmount: string;
  liquidatedAmount: string;
  createdAt: string;
}

export const loanRecordsPipe = (
  resultSet: IGetLoanRecordResponse[],
): ILoanRecord[] => {
  return resultSet.map((loanRecord: IGetLoanRecordResponse) => ({
    ...loanRecord,
    recordId: loanRecord.loanId,
    loanTerm: getTermObjectByValue(loanRecord.loanTerm),
    createdAt: dayjs(formatSolidityTime(loanRecord.createdAt)),
    recordType: RecordType.Loan,
  }));
};
