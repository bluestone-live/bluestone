import * as React from 'react';
import styled from 'styled-components';
import { withTranslation, WithTranslation } from 'react-i18next';

interface IProps extends WithTranslation {
  defaultAccount?: string;
  onAccountClick: () => void;
}

const StyledHeader = styled.div`
  margin-bottom: ${props => props.theme.spacingUnit.small};
  height: 70px;
  background-color: #f8f8f8;
  border-bottom: 1px solid ${props => props.theme.borderColor};
`;

const StyledBrand = styled.div`
  font-size: 24px;
  font-weight: bolder;
  position: absolute;
  text-align: center;
  width: 100%;
  height: 70px;
  line-height: 70px;
`;

const StyledActionBar = styled.div`
  height: 100%;
  width: 45%;
  float: right;
  position: relative;
  z-index: 10;

  &::after {
    content: '';
    display: table;
    clear: both;
  }
`;

const StyledActionBarItem = styled.div`
  float: right;
  line-height: 70px;
  padding: 0 8px;
  cursor: pointer;
`;

const StyledAccountItem = styled(StyledActionBarItem)`
  max-width: 120px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`;

class Header extends React.PureComponent<IProps> {
  render() {
    const { defaultAccount, t, onAccountClick } = this.props;
    return (
      <StyledHeader>
        <StyledBrand>BlueStone</StyledBrand>
        <StyledActionBar>
          <StyledAccountItem onClick={onAccountClick}>
            {defaultAccount ? defaultAccount : t('no_account')}
          </StyledAccountItem>
          <StyledActionBarItem>{t('FAQ')}</StyledActionBarItem>
        </StyledActionBar>
      </StyledHeader>
    );
  }
}

export default withTranslation()(Header);
