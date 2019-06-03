import styled from 'styled-components';

const StyledInput = styled.input`
  font-size: ${props => props.theme.fontSize};
  padding: 10px;
  width: 100%;
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: ${props => props.theme.borderRadius};
  outline: none;

  &:focus {
    border-color: ${props => props.theme.primaryColor};
  }
`;

const Input = props => {
  return <StyledInput {...props} />;
};

export default Input;
