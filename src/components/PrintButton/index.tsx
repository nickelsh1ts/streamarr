import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const PrintButton = () => {
  const print = () => window.print();

  return (
    <button
      onClick={print}
      type="button"
      className="btn rounded-0 btn-outline-secondary text-decoration-none text-uppercase me-4 me-md-5 ms-auto d-print-none border-2"
    >
      <FontAwesomeIcon icon={faPrint} /> Print
    </button>
  );
};

export default PrintButton;
