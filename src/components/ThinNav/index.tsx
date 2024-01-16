import LoginButton from '@app/components/LoginButton';

const ThinNav = () => {
  return (
    <>
      <header
        id="NavThin"
        className="navbar navbar-dark align-items-center px-md-4 border-bottom border-dark mb-3"
        style={{ background: 'rgba(8,0,17,1)' }}
      >
        <div className="container-fluid px-md-2">
          <a href="/" className="navbar-brand me-0">
            <img
              src="/img/sm-logo_full.png"
              alt="logo"
              style={{ width: '7rem', height: 'auto' }}
              className="img-fluid"
            />
          </a>
          <ul className="navbar-nav me-auto mb-sm-0 d-flex flex-row">
            <div className="bg-light mx-2" style={{ width: ' 1px' }}></div>
            <li className="nav-item">
              <a href="/help" className="nav-link link-secondary px-2">
                Help Centre
              </a>
            </li>
          </ul>
          <div className="d-flex order-sm-3 no-print me-md-2 me-0 order-2 flex-row">
            <div className="navbar-nav ms-auto m-0 flex-row p-0">
              <LoginButton />
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default ThinNav;
