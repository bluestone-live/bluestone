import * as React from 'react';
import styled from 'styled-components';
import { observer, inject } from 'mobx-react';
import { AccountStore } from '../stores';
import { withTranslation, WithTranslation } from 'react-i18next';
import { ThemedProps } from '../styles/themes';

interface IProps extends WithTranslation {
  accountStore?: AccountStore;
}

const StyledImagePanel = styled.section`
  text-align: center;
  color: ${(props: ThemedProps) => props.theme.fontColors.primary};
  font-size: ${(props: ThemedProps) => props.theme.fontSize.medium};
`;

@inject('accountStore')
@observer
class AuthorizationReminder extends React.Component<IProps> {
  render() {
    const { accountStore, t } = this.props;
    return accountStore!.defaultAccount ? (
      <StyledImagePanel>{t('please_click_connect')}</StyledImagePanel>
    ) : null;
  }
}

export default withTranslation()(AuthorizationReminder);
