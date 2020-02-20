import React, { useCallback } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';

const Brand = (props: RouteComponentProps) => {
  const redirectToHome = useCallback(() => props.history.replace('/'), []);
  return <div className="brand" onClick={redirectToHome} />;
};

export default withRouter(Brand);
