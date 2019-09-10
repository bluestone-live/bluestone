import * as React from 'react';
import styled from 'styled-components';
import { ThemedProps } from '../../styles/themes';

interface IProps {
  children: React.ReactChild | React.ReactChild[] | string;
  options: IDropdownOption[];
  onSelected: (option: IDropdownOption) => void;
  className?: string;
}

const StyledDropdown = styled.div`
  position: relative;
  z-index: 10;
  border: 1px solid ${(props: ThemedProps) => props.theme.borderColor.secondary};
  border-radius: ${(props: ThemedProps) => props.theme.borderRadius.medium};
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
  border: 1px solid ${(props: ThemedProps) => props.theme.borderColor.secondary};
  border-radius: ${(props: ThemedProps) => props.theme.borderRadius.medium};
  top: 44px;
  left: 0;
`;

const StyledOption = styled.div`
  width: 100%;
  height: 44px;
  color: ${(props: ThemedProps) => props.theme.fontColors.inverted};
  border-bottom: 1px solid
    ${(props: ThemedProps) => props.theme.borderColor.secondary};
  cursor: pointer;
`;

export interface IDropdownOption {
  text: string;
  key: any;
}

interface IState {
  showOptions: boolean;
}

export default class Dropdown extends React.Component<IProps, IState> {
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
    const { children, options, className } = this.props;
    const { showOptions } = this.state;
    return (
      <StyledDropdown
        className={className}
        onClick={this.onDropdownClick}
        onBlur={this.hideOptions}
      >
        {children}
        {showOptions && (
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
        )}
      </StyledDropdown>
    );
  }
}
