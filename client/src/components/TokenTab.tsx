import React, { useCallback, useMemo } from 'react';
import { IToken } from '../stores';
import Menu, { ClickParam } from 'antd/lib/menu';

interface IProps {
  selectedToken?: IToken;
  tokens: IToken[];
  onTokenSelect: (token: IToken) => void;
}

const TokenTab = (props: IProps) => {
  const { selectedToken, onTokenSelect, tokens } = props;

  const onClick = useCallback(
    (e: ClickParam) => {
      const token = tokens.find(t => t.tokenAddress === e.key);
      if (token) {
        onTokenSelect(token);
      }
    },
    [onTokenSelect],
  );

  const tabWidth = useMemo(() => `${Math.round(100 / tokens.length)}%`, [
    tokens,
  ]);

  return (
    <Menu
      className="token-tab"
      mode="horizontal"
      onClick={onClick}
      selectedKeys={selectedToken ? [selectedToken.tokenAddress] : undefined}
    >
      {tokens.map((token, i) => (
        <Menu.Item
          key={token.tokenAddress}
          className={i === 0 ? 'first' : undefined}
          style={{ width: tabWidth }}
        >
          {token.tokenSymbol}
        </Menu.Item>
      ))}
    </Menu>
  );
};

export default TokenTab;
