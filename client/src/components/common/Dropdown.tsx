import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import styled from 'styled-components';

const StyledDropdown = styled.div`
  position: relative;
  z-index: 10;
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: ${props => props.theme.borderRadius};
  width: 100%;
  min-width: 120px;
  text-align: center;
  height: 44px;
  line-height: 44px;
  cursor: pointer;
`;

const StyledOptionsContainer = styled.div`
  position: absolute;
  width: 100%;
  background-color: #fff;
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: ${props => props.theme.borderRadius};
  top: 44px;
  left: 0;
`;

const StyledOption = styled.div`
  width: 100%;
  height: 44px;
  border-bottom: 1px solid ${props => props.theme.borderColor};
  cursor: pointer;
`;

interface IDropdownOption {
  text: string;
  key: any;
}

interface IProps extends WithTranslation {
  children: React.ReactChild | React.ReactChild[];
  options: IDropdownOption[];
  onSelected: (option: IDropdownOption) => void;
}

interface IState {
  showOptions: boolean;
}

class Dropdown extends React.Component<IProps, IState> {
  state = {
    showOptions: false,
  };

  onDropdownClick = () =>
    this.setState({
      showOptions: !this.state.showOptions,
    });

  hideOptions = () =>
    this.setState({
      showOptions: false,
    });

  onOptionClick = (option: IDropdownOption) => (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    e.stopPropagation();
    this.props.onSelected(option);
    this.hideOptions();
  };

  render() {
    const { children, options } = this.props;
    const { showOptions } = this.state;
    return (
      <StyledDropdown onClick={this.onDropdownClick} onBlur={this.hideOptions}>
        {children}
        {showOptions ? (
          <StyledOptionsContainer>
            {options.map(option => (
              <StyledOption
                key={option.key}
                onClick={this.onOptionClick(option)}
              >
                {option.text}
              </StyledOption>
            ))}
          </StyledOptionsContainer>
        ) : null}
      </StyledDropdown>
    );
  }
}

export default withTranslation()(Dropdown);
