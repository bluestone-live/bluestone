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
  collateralCoverageRatio: string;
  minCollateralCoverageRatio: string;
  alreadyPaidAmount: string;
  soldCollateralAmount: string;
  liquidatedAmount: string;
  createdAt: string;
  dueAt: string;
  remainingDebt: string;
}

export const loanRecordsPipe = (
  resultSet: IGetLoanRecordResponse[],
): ILoanRecord[] => {
  return resultSet.map((loanRecord: IGetLoanRecordResponse) => ({
    recordId: loanRecord.loanId,
    loanTokenAddress: loanRecord.loanTokenAddress,
    collateralTokenAddress: loanRecord.collateralTokenAddress,
    loanAmount: loanRecord.loanAmount,
    collateralAmount: loanRecord.collateralAmount,
    loanTerm: getTermObjectByValue(loanRecord.loanTerm),
    annualInterestRate: loanRecord.annualInterestRate,
    interest: loanRecord.interest,
    collateralCoverageRatio: loanRecord.collateralCoverageRatio,
    minCollateralCoverageRatio: loanRecord.minCollateralCoverageRatio,
    alreadyPaidAmount: loanRecord.alreadyPaidAmount,
    soldCollateralAmount: loanRecord.soldCollateralAmount,
    liquidatedAmount: loanRecord.liquidatedAmount,
    remainingDebt: loanRecord.remainingDebt,
    createdAt: dayjs.utc(formatSolidityTime(loanRecord.createdAt)),
    dueAt: dayjs.utc(formatSolidityTime(loanRecord.dueAt)),
    isOverDue: dayjs
      .utc(formatSolidityTime(loanRecord.dueAt))
      .isBefore(dayjs.utc()),
    isClosed: loanRecord.isClosed,
    recordType: RecordType.Borrow,
  }));
};
