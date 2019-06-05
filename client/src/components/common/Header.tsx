import * as React from 'react';
import styled from 'styled-components';
import { withTranslation, WithTranslation } from 'react-i18next';

interface IProps extends WithTranslation {
  defaultAccount?: string;
}

const StyledHeader = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 0px 5px;
  margin-bottom: 15px;
`;

const Brand = styled.div`
  flex: 1;
  font-size: 24px;
  font-weight: bolder;
`;

const ActionBar = styled.div`
  flex: 1;
  max-width: 40vw;
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
          {defaultAccount ? defaultAccount : t('waiting_for_connect')}
        </ActionBar>
      </StyledHeader>
    );
  }
}

export default withTranslation()(Header);
