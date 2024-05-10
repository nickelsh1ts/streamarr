'use client';
import LoginPage from '@app/components/login-page';
import LoadingPlaceholder from '@app/components/common/loading-placeholder';
import React from 'react';

interface MyProps {}

interface MyState {
  component: string;
}

const asyncComponent = (importComponent) => {
  class AsyncComponent extends React.Component<MyProps, MyState> {
    constructor(props) {
      super(props);
      this.state = {
        component: null,
      };
    }

    async componentDidMount() {
      const { default: component } = await importComponent();
      this.setState({
        component: component,
      });
    }

    render() {
      const C = this.state.component;
      return C ? <C {...this.props} /> : <LoadingPlaceholder />;
    }
  }
  return AsyncComponent;
};

let App;
if (window.location.pathname.startsWith('/sso/403')) {
  App = asyncComponent(() => import('@app/components/access-denied-page'));
} else if (window.location.pathname.startsWith('/sso/admin')) {
  App = asyncComponent(() => import('@app/components/sso-admin-page'));
} else {
  App = LoginPage;
}

export default App;
