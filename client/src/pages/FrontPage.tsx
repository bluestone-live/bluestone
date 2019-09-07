import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import styled from 'styled-components';
import Card from '../components/common/Card';
import TextBox from '../components/common/TextBox';
import { ThemedProps } from '../styles/themes';
import Anchor from '../components/html/Anchor';

const Portal = styled.div`
  display: flex;
`;

const StyledEntry = styled(Card)`
  flex: 1;
  text-align: center;
  padding: ${(props: ThemedProps) => props.theme.gap.largest};

  &:first-child {
    margin-right: ${(props: ThemedProps) => props.theme.gap.small};
  }
  &:last-child {
    margin-left: ${(props: ThemedProps) => props.theme.gap.small};
  }
`;

const StyledTextBox = styled(TextBox)`
  margin: ${(props: ThemedProps) => props.theme.gap.largest} 0;
  font-size: ${(props: ThemedProps) => props.theme.fontSize.huge};
`;

const FrontPage = (props: WithTranslation) => {
  return (
    <Portal>
      <StyledEntry>
        <Anchor to="/deposit-assets">
          <StyledTextBox>{props.t('portal_page_deposit')}</StyledTextBox>
        </Anchor>
      </StyledEntry>
      <StyledEntry>
        <Anchor to="/loan-assets">
          <StyledTextBox>{props.t('portal_page_borrow')}</StyledTextBox>
        </Anchor>
      </StyledEntry>
    </Portal>
  );
};

export default withTranslation()(FrontPage);
