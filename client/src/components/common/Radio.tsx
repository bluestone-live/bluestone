import * as React from 'react';
import styled from 'styled-components';
import { ThemedProps } from '../../styles/themes';
import Input from '../html/Input';

interface IRadioOption {
  text: string;
  value: number | string;
}

interface IProps {
  options: IRadioOption[];
  onChange: (value: number | string) => void;
  className?: string;
  name: string;
  selectedOption?: IRadioOption;
}

const StyledRadio = styled.div`
  display: flex;
  align-items: stretch;
`;

const StyledRadioOption = styled.div`
  display: flex;
  align-items: center;
  margin: 0 ${(props: ThemedProps) => props.theme.gap.small};
`;

const StyledRadioInput = styled(Input)`
  width: 16px;
  margin-right: 5px;
`;

const StyledLabel = styled.label``;

export default ({
  options,
  onChange,
  className,
  name,
  selectedOption,
}: IProps) => {
  const onChangeHandler = (option: IRadioOption) => () => {
    onChange(option.value);
  };

  return (
    <StyledRadio className={className}>
      {options.map(option => (
        <StyledRadioOption key={`radio-option-${option.value}`}>
          <StyledRadioInput
            key={`radio-option-input-${option.value}`}
            name={name}
            type="radio"
            onChange={onChangeHandler(option)}
            checked={
              selectedOption ? option.value === selectedOption.value : false
            }
          />
          <StyledLabel>{option.text}</StyledLabel>
        </StyledRadioOption>
      ))}
    </StyledRadio>
  );
};
