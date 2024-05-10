
const AccessDeniedPage = ({ message }) => (
    <div className="access-denied">
        <div className="access-denied-center">
            <img className="access-denied-item" src={''} alt="Logo" />
            <br />
            <p className="access-denied-item" dangerouslySetInnerHTML={{ __html: message || 'Access Denied'}}></p>
        </div>
    </div>
);

export default AccessDeniedPage;
