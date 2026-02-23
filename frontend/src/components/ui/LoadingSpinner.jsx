import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'md', className = '', text }) => {
  return (
    <div className={`loading-container ${className}`}>
      <div className={`loading-spinner spinner-${size}`}></div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
