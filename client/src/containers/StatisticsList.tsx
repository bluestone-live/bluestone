import React, { useCallback, Fragment } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { IGeneralStats, ITokenStats } from '../stores';
import styled from 'styled-components';
import { Row, Cell } from '../components/common/Layout';
import { ThemedProps } from '../styles/themes';
import { convertWeiToDecimal, BigNumber } from '../utils/BigNumber';

interface IProps extends WithTranslation {
  generalStats: IGeneralStats;
  generalStatKeys: string[];
  tokenStats: ITokenStats[];
  tokenStatKeys: string[];
}

const StyledRow = styled(Row)`
  padding: ${(props: ThemedProps) => props.theme.gap.medium} 0;
  border-bottom: 1px solid
    ${(props: ThemedProps) => props.theme.borderColor.primary};

  > div {
    align-self: center;
    padding: 0 ${(props: ThemedProps) => props.theme.gap.medium};
  }
`;

const StyledCellAlignLeft = styled(Cell)`
  text-align: left;
`;

const StyledCellAlignRight = styled(Cell)`
  text-align: right;
`;

const StatisticsList = (props: IProps) => {
  const { generalStats, generalStatKeys, tokenStats, tokenStatKeys, t } = props;

  // Callback
  const renderGeneralStatItem = useCallback(
    (key: keyof IGeneralStats) => {
      return (
        <StyledRow key={key}>
          <StyledCellAlignRight>{t(key)}</StyledCellAlignRight>
          <StyledCellAlignRight>
            {convertWeiToDecimal(generalStats[key])}
          </StyledCellAlignRight>
        </StyledRow>
      );
    },
    [generalStats],
  );

  const renderTokenStatItem = useCallback(
    (tokenStat: ITokenStats, key: keyof ITokenStats) => {
      return (
        <StyledRow key={key + tokenStat.tokenAddress}>
          <StyledCellAlignRight>{tokenStat.tokenSymbol}</StyledCellAlignRight>
          <StyledCellAlignRight>
            {convertWeiToDecimal(tokenStat[key] as BigNumber)}
          </StyledCellAlignRight>
        </StyledRow>
      );
    },

    [tokenStats],
  );

  const renderTokenStatBlock = useCallback(
    (key: string) => (
      <Fragment>
        <StyledRow key={key}>
          <StyledCellAlignLeft>{t(key)}</StyledCellAlignLeft>
        </StyledRow>
        {tokenStats.map(tokenStat =>
          renderTokenStatItem(tokenStat, key as keyof ITokenStats),
        )}
      </Fragment>
    ),
    [tokenStats],
  );

  return (
    <div>
      {generalStatKeys.map(key =>
        renderGeneralStatItem(key as keyof IGeneralStats),
      )}
      {tokenStatKeys.map(key => renderTokenStatBlock(key))}
    </div>
  );
};

export default withTranslation()(StatisticsList);
