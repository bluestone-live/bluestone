import * as React from 'react';
import styled from 'styled-components';
import { ThemedProps } from '../../styles/themes';

interface IProps {
  defaultValue: boolean;
  onChange: (state: boolean) => void;
  disabled?: boolean;
}

const StyledToggle = styled.div`
  border: 1px solid ${(props: ThemedProps) => props.theme.borderColor.secondary};
  border-radius: 18px;
  width: 72px;
  height: 36px;
  position: relative;
  transition: 300ms;
  cursor: pointer;

  &.disabled {
    cursor: pointer;
  }
`;

const Slider = styled.div`
  border: 1px solid ${(props: ThemedProps) => props.theme.borderColor.secondary};
  height: 32px;
  width: 32px;
  border-radius: 16px;
  background-color: ${(props: ThemedProps) => props.theme.colors.primary};
  position: relative;
  top: 1px;
  left: 1px;
  transition: 300ms;

  &.off {
    left: 37px;
    background-color: ${(props: ThemedProps) =>
      props.theme.backgroundColor.secondary};
  }
`;

export default (props: IProps) => {
  const onClickHandler = () => {
    if (props.disabled) {
      return;
    }
    props.onChange(!props.defaultValue);
  };

  return (
    <StyledToggle
      onClick={onClickHandler}
      className={props.disabled ? 'disabled' : ''}
    >
      <Slider className={props.defaultValue ? 'on' : 'off'} />
    </StyledToggle>
  );
};
