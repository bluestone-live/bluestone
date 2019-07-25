import * as React from 'react';
import styled from 'styled-components';
import { DefaultTheme } from '../../../styles/themes';
import { MessageType } from '.';

export interface IMessage {
  message:
    | React.ReactChild
    | React.ReactChild[]
    | string
    | object
    | undefined
    | null;
  type: MessageType;
  style?: React.CSSProperties;
  duration: number;
  removeSelf?: () => void;
}

const StyledMessageBox = styled.div`
  position: absolute;
  top: ${DefaultTheme.gap.largest};
  left: 50%;
  transform: translate(-50%, 0);
  margin: 0 auto;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
  background-color: ${DefaultTheme.backgroundColor.primary};
  border-radius: ${DefaultTheme.borderRadius.small};
  padding: ${`${DefaultTheme.gap.small} 40px ${DefaultTheme.gap.small} ${DefaultTheme.gap.small}`};
  box-sizing: border-box;
  height: 40px;
  line-height: 26px;
  transition: top 500ms;

  & .close-btn {
    position: absolute;
    right: ${DefaultTheme.gap.small};
    top: 0;
  }

  &::before {
    height: 26px;
    width: 26px;
    line-height: 26px;
    position: relative;
    display: block;
    float: left;
    text-align: center;
    border-radius: 50%;
    color: white;
    margin-right: 8px;
  }

  &.info::before {
    content: 'i';
    background-color: #039be5;
  }
  &.success::before {
    content: '✓';
    background-color: #43a047;
  }
  &.warning::before {
    content: '!';
    background-color: #fdd835;
  }
  &.error::before {
    content: '✕';
    background-color: #f4511e;
  }
`;

const MessageBox = (props: IMessage) => {
  return (
    <StyledMessageBox className={props.type} style={props.style}>
      {props.message}
      <div className="close-btn" onClick={props.removeSelf}>
        &times;
      </div>
    </StyledMessageBox>
  );
};

export default MessageBox;
