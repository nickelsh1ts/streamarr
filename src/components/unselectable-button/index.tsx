const UnselectableButton = ({ onClick, children }) => (
  <button
    type="submit"
    className="btn btn-lg btn-outline-warning"
    onClick={onClick}
    onFocus={(e) => e.target.blur()}
  >
    {children}
  </button>
);

export default UnselectableButton;
