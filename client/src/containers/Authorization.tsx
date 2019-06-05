import * as React from 'react';
import styled from 'styled-components';
import { observer, inject } from 'mobx-react';
import { Account } from '../stores';
import { withTranslation, WithTranslation } from 'react-i18next';

const AuthImg = require('../styles/images/auth-eg.png');

interface IProps extends WithTranslation {
  account?: Account;
}

const StyledImagePanel = styled.section`
  text-align: center;
  color: ${props => props.theme.fontColor};
  font-size: ${props => props.theme.fontSize};
`;

@inject('account')
@observer
class AuthorizationReminder extends React.Component<IProps> {
  render() {
    const { account, t } = this.props;
    return account!.defaultAccount ? null : (
      <StyledImagePanel>
        {t('please_click_connect')}
        <img src={AuthImg} alt={t('please_click_connect')} />
      </StyledImagePanel>
    );
  }
}

export default withTranslation()(AuthorizationReminder);
