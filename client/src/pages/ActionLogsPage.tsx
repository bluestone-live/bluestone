import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { inject, observer } from 'mobx-react';
import { ActionLogStore } from '../stores';
import Card from '../components/common/Card';
import { ActionType } from '../constants/ActionLog';
import Form from '../components/html/Form';
import Select from '../components/html/Select';
import styled from 'styled-components';
import { Cell, Row } from '../components/common/Layout';
import { getEnumValidKeys } from '../utils/getEnumValidKeys';

interface IProps extends WithTranslation {
  actionLogStore: ActionLogStore;
}

const StyledHeaderCell = styled(Cell)`
  font-weight: bolder;
`;

@inject('actionLogStore')
@observer
class ActionLogsPage extends React.Component<IProps> {
  async componentDidMount() {
    await this.props.actionLogStore.getActionLogs();
  }

  render() {
    const { t, actionLogStore } = this.props;
    return (
      <Card>
        <div className="filters">
          <Form.Item>
            <label htmlFor="action-type-filter">{t('action_type')}</label>
            <Select id="action-type-filter">
              {getEnumValidKeys(ActionType)
                .map(k => ({
                  value: k,
                  text: t(ActionType[Number.parseInt(k, 10)]),
                }))
                .map(({ value, text }: { value: string; text: string }) => (
                  <option key={`${value}${text}`} value={value}>
                    {text}
                  </option>
                ))}
            </Select>
          </Form.Item>
        </div>
        <div className="tx-list">
          <Row>
            <StyledHeaderCell>{t('action_type')!}</StyledHeaderCell>
            <StyledHeaderCell>{t('token')!}</StyledHeaderCell>
            <StyledHeaderCell>{t('txid')!}</StyledHeaderCell>
          </Row>
          {actionLogStore.actionLogs.map(log => (
            <Row key={`${log.txid}-row`}>
              <Cell>{t(log.actionType.toString())}</Cell>
              <Cell>{log.token.symbol}</Cell>
              <Cell>
                <a href={log.link} target="eth_scanner">
                  {log.txid}
                </a>
              </Cell>
            </Row>
          ))}
        </div>
      </Card>
    );
  }
}

export default withTranslation()(ActionLogsPage);
