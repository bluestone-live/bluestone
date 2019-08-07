import * as React from 'react';
import styled from 'styled-components';
import { withTranslation, WithTranslation } from 'react-i18next';
import { ThemedProps } from '../../styles/themes';
import Anchor from '../html/Anchor';

interface IProps extends WithTranslation {
  defaultAccount?: string;
  onAccountClick: () => void;
}

const StyledHeader = styled.div`
  height: 77px;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
`;

const StyledBrand = styled(Anchor)`
  font-size: ${(props: ThemedProps) => props.theme.fontSize.large};
  font-weight: bold;
  text-align: center;
  width: 200px;
  height: 77px;
  line-height: 77px;
`;

const StyledMenu = styled.div`
  height: 77px;
  line-height: 77px;
  display: flex;
  z-index: 10;

  &::after {
    content: '';
    display: table;
    clear: both;
  }
`;

const StyledMenuItem = styled.div`
  font-size: ${(props: ThemedProps) => props.theme.fontSize.large};
  font-weight: bold;
  min-width: 80px;
  height: 77px;
  line-height: 77px;
  padding: 0 ${(props: ThemedProps) => props.theme.gap.medium};
  cursor: pointer;
`;

const StyledAccountItem = styled(StyledMenuItem)`
  width: 150px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`;

class Header extends React.PureComponent<IProps> {
  render() {
    const { defaultAccount, t, onAccountClick } = this.props;
    return (
      <StyledHeader>
        <StyledBrand to="/">BlueStone</StyledBrand>
        <StyledMenu>
          <StyledMenuItem>{t('faq')}</StyledMenuItem>
          <StyledAccountItem onClick={onAccountClick}>
            {defaultAccount ? defaultAccount : t('no_account')}
          </StyledAccountItem>
        </StyledMenu>
      </StyledHeader>
    );
  }
}

export default withTranslation()(Header);
