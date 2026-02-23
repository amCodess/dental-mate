import PropTypes from 'prop-types';
import './Badge.css';

const Badge = ({
    children,
    variant = 'neutral', // éxito, aviso, error, info, neutro, primario
    size = 'md', // chico, medio
    dot = false,
    className = '',
    ...props
}) => {
    const classes = [
        'badge',
        `badge-${variant}`,
        `badge-${size}`,
        className
    ].filter(Boolean).join(' ');

    return (
        <span className={classes} {...props}>
            {dot && <span className="badge-dot" />}
            {children}
        </span>
    );
};

Badge.propTypes = {
    children: PropTypes.node.isRequired,
    variant: PropTypes.oneOf(['success', 'warning', 'error', 'info', 'neutral', 'primary']),
    size: PropTypes.oneOf(['sm', 'md']),
    dot: PropTypes.bool,
    className: PropTypes.string,
};

export default Badge;
