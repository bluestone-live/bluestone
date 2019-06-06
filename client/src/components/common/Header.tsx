import * as React from 'react';
import styled from 'styled-components';
import { withTranslation, WithTranslation } from 'react-i18next';

interface IProps extends WithTranslation {
  defaultAccount?: string;
}

const StyledHeader = styled.div`
  margin-bottom: ${props => props.theme.spacingUnit.small};
  height: 70px;
  background-color: #f8f8f8;
  border-bottom: 1px solid ${props => props.theme.borderColor};
`;

const Brand = styled.div`
  font-size: 24px;
  font-weight: bolder;
  position: absolute;
  text-align: center;
  width: 100%;
  height: 70px;
  line-height: 70px;
`;

const ActionBar = styled.div`
  height: 100%;
  width: 45%;
  float: right;

  &::after {
    content: '';
    display: table;
    clear: both;
  }
`;

const ActionBarItem = styled.div`
  float: right;
  line-height: 70px;
  padding: 0 8px;
`;

const AccountItem = styled(ActionBarItem)`
  max-width: 120px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`;

class Header extends React.PureComponent<IProps> {
  render() {
    const { defaultAccount, t } = this.props;
    return (
      <StyledHeader>
        <Brand>BlueStone</Brand>
        <ActionBar>
          <AccountItem>
            {defaultAccount ? defaultAccount : t('no_account')}
          </AccountItem>
          <ActionBarItem>{t('FAQ')}</ActionBarItem>
        </ActionBar>
      </StyledHeader>
    );
  }
}

export default withTranslation()(Header);
