import PropTypes from 'prop-types';
import './Card.css';

const Card = ({
    children,
    title,
    subtitle,
    footer,
    className = '',
    variant = 'default', // normal, elevado, bordeado
    padding = 'md', // sin, chico, medio, grande
    onClick,
    ...props
}) => {
    const variantClass = `card-${variant}`;
    const paddingClass = `card-padding-${padding}`;

    const classes = [
        'card',
        variantClass,
        paddingClass,
        onClick && 'card-clickable',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} onClick={onClick} {...props}>
            {(title || subtitle) && (
                <div className="card-header">
                    {title && <h3 className="card-title">{title}</h3>}
                    {subtitle && <p className="card-subtitle">{subtitle}</p>}
                </div>
            )}

            <div className="card-content">
                {children}
            </div>

            {footer && (
                <div className="card-footer">
                    {footer}
                </div>
            )}
        </div>
    );
};

Card.propTypes = {
    children: PropTypes.node,
    title: PropTypes.node,
    subtitle: PropTypes.node,
    footer: PropTypes.node,
    className: PropTypes.string,
    variant: PropTypes.oneOf(['default', 'elevated', 'outlined', 'flat']),
    padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
    onClick: PropTypes.func,
};

export default Card;
