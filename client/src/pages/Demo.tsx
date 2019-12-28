import React, { useCallback, useState } from 'react';
import TokenTab from '../components/TokenTab';
import { useDepositTokens, IToken } from '../stores';

const Demo = () => {
  const tokens = useDepositTokens();

  const [selectedToken, setSelectedToken] = useState();

  const onTokenSelect = useCallback(
    (token: IToken) => setSelectedToken(token),
    [tokens],
  );

  return (
    <TokenTab
      tokens={tokens}
      onTokenSelect={onTokenSelect}
      selectedToken={selectedToken}
    />
  );
};

export default Demo;
