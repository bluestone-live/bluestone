import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router-dom';
import { observer, inject } from 'mobx-react';
import styled from 'styled-components';
import Header from '../components/common/Header';

interface IProps extends RouteComponentProps, WithTranslation {
  children: React.ReactChild;
  account: Account;
  title?: string | React.ReactChildren;
}

interface IStates {
  openDrawer: boolean;
}

const StyledContainer = styled.div`
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  margin: 0 auto;
  padding: 0;
  font-family: ${props => props.theme.fontFamily};
  font-size: ${props => props.theme.fontSize};
  background-color: ${props => props.theme.backgroundColor};
`;

@inject('account')
@observer
class Default extends React.Component<IProps, IStates> {
  state = {
    openDrawer: false,
  };

  toggleDrawer = () => {
    this.setState({
      openDrawer: !this.state.openDrawer,
    });
  };

  render() {
    const { children } = this.props;
    return (
      <div className="layout default">
        <Header />
        <StyledContainer className="container">{children}</StyledContainer>
      </div>
    );
  }
}

export default withTranslation()(Default);
