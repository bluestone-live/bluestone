import * as React from 'react';
import styled from 'styled-components';
import { ThemedProps } from '../../styles/themes';
import Input from '../html/Input';

export interface IRadioOption<T> {
  text: string;
  value: T;
}

interface IProps<T> {
  options: Array<IRadioOption<T>>;
  onChange: (value: T) => void;
  className?: string;
  name: string;
  selectedOption?: IRadioOption<T>;
}

const StyledRadio = styled.div`
  display: flex;
  align-items: stretch;
`;

const StyledRadioOption = styled.div`
  display: flex;
  align-items: center;
  margin-right: ${(props: ThemedProps) => props.theme.gap.small};
`;

const StyledRadioInput = styled(Input)`
  width: 16px;
  margin-right: 5px;
`;

const StyledLabel = styled.label`
  flex: 1 !important;
`;

// use class component because functional component does not support generic
export default class Radio<T> extends React.PureComponent<IProps<T>> {
  onChangeHandler = (option: IRadioOption<T>) => () =>
    this.props.onChange(option.value);

  render() {
    const { options, className, name, selectedOption } = this.props;

    return (
      <StyledRadio className={className}>
        {options.map(option => (
          <StyledRadioOption key={`radio-option-${option.value}`}>
            <StyledRadioInput
              key={`radio-option-input-${option.value}`}
              name={name}
              type="radio"
              onChange={this.onChangeHandler(option)}
              checked={
                selectedOption ? option.value === selectedOption.value : false
              }
            />
            <StyledLabel>{option.text}</StyledLabel>
          </StyledRadioOption>
        ))}
      </StyledRadio>
    );
  }
}
