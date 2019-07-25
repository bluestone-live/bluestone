import * as React from 'react';
import styled from 'styled-components';
import MessageBox, { IMessage } from './MessageBox';
import { getRandomId } from '../../../utils/getRandomId';

interface IStoredMessage extends IMessage {
  id: string;
}

interface IState {
  messages: IStoredMessage[];
}

const StyledMessageContainer = styled.div`
  position: relative;
`;

export class MessageList extends React.Component<{}, IState> {
  state = {
    messages: new Array<IStoredMessage>(),
  };

  pushMessage(message: IMessage) {
    const id = getRandomId(8);
    this.setState({
      messages: [...this.state.messages, { ...message, id }],
    });

    if (message.duration > 0) {
      setTimeout(() => {
        this.removeMessage(id)();
      }, message.duration);
    }
  }

  removeMessage = (id: string) => () =>
    this.setState({
      messages: this.state.messages.filter(m => m.id !== id),
    });

  render() {
    const { messages } = this.state;

    return (
      <StyledMessageContainer id="message-container">
        {messages.map((message, index) => (
          <MessageBox
            style={{ top: (index + 1) * 45 }}
            key={`message-${index}`}
            {...message}
            removeSelf={this.removeMessage(message.id)}
          />
        ))}
      </StyledMessageContainer>
    );
  }
}

export default MessageList;
