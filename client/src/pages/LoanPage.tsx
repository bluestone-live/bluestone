import * as React from 'react';
import LoanForm from '../containers/LoanForm';
import parseQuery from '../utils/parseQuery';
import Card from '../components/common/Card';

interface IProps {
  location: any;
}

export default class LoanPage extends React.Component<IProps> {
  render() {
    const { location } = this.props;
    const queryParams = parseQuery(location.search);

    return (
      <div>
        <Card>
          <LoanForm {...queryParams} />
        </Card>
      </div>
    );
  }
}
