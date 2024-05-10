import type { Metadata } from 'next';
import LoginPage from '@app/components/login-page';
import LoadingPlaceholder from './components/common/loading-placeholder';
import { Component } from 'react';

export const metadata: Metadata = {
  title: 'Stream the greatest Movies, Series, Classics and more - Streamarr',
};

const asyncComponent = importComponent => {
  class AsyncComponent extends Component {
      constructor(props) {
          super(props);
          this.state = {
              component: null
          };
      }

      async componentDidMount() {
          const { default: component } = await importComponent();
          this.setState({
              component: component
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
    App = asyncComponent(() => import('../components/access-denied-page'));
}
else if (window.location.pathname.startsWith('/sso/admin')) {
    App = asyncComponent(() => import('../components/sso-admin-page'));
}
else {
    App = LoginPage;
}

export default App;
