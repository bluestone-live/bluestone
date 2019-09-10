import * as React from 'react';
import * as ReactDOM from 'react-dom';
import MessageList from './MessageContainer';

export enum MessageType {
  Info = 'info',
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
}

/**
 * Usage:
 *
 * Message.show(message, type [, duration])
 * or
 * Message.<info | success | warning | error>(message [, duration])
 *
 */
export default class Message {
  static ref: React.RefObject<MessageList> | null = null;

  /**
   * Show new message in selected type
   * @param message: string or custom react element
   * @param type: info | success | warning | error
   * @param duration: the message won't disappear until click the close button when duration is <= 0;
   */
  static show = (
    message: string | React.ReactElement,
    type: MessageType,
    duration: number = 0,
  ) => {
    const $el = document.querySelector('#message-container-wrapper')!;

    if (!Message.ref) {
      Message.ref = React.createRef<MessageList>();

      const messageContainerInstance = <MessageList ref={Message.ref} />;

      ReactDOM.render(messageContainerInstance, $el);
      Message.ref!.current!.pushMessage({ message, type, duration });
    } else {
      Message.ref!.current!.pushMessage({ message, type, duration });
    }
  };
  /**
   * Show info message
   * @param message: string or custom react element
   * @param duration: the message won't disappear until click the close button when duration is <= 0;
   */
  static info = (
    children: string | React.ReactElement,
    duration: number = 3000,
  ) => Message.show(children, MessageType.Info, duration);
  /**
   * Show success message
   * @param message: string or custom react element
   * @param duration: the message won't disappear until click the close button when duration is <= 0;
   */
  static success = (
    children: string | React.ReactElement,
    duration: number = 3000,
  ) => Message.show(children, MessageType.Success, duration);
  /**
   * Show warning message
   * @param message: string or custom react element
   * @param duration: the message won't disappear until click the close button when duration is <= 0;
   */
  static warning = (
    children: string | React.ReactElement,
    duration: number = 3000,
  ) => Message.show(children, MessageType.Warning, duration);
  /**
   * Show error message
   * @param message: string or custom react element
   * @param duration: the message won't disappear until click the close button when duration is <= 0;
   */
  static error = (
    children: string | React.ReactElement,
    duration: number = 3000,
  ) => Message.show(children, MessageType.Error, duration);
}
