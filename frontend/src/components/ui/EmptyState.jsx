import { Button } from './index';
import './EmptyState.css';

const EmptyState = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className = ''
}) => {
    return (
        <div className={`empty-state ${className}`}>
            {Icon && (
                <div className="empty-state-icon-wrapper">
                    <Icon size={40} strokeWidth={1.5} />
                </div>
            )}
            <h3 className="empty-state-title">{title}</h3>
            {description && <p className="empty-state-description">{description}</p>}

            {actionLabel && onAction && (
                <Button variant="primary" onClick={onAction} className="mt-4">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};

export default EmptyState;
