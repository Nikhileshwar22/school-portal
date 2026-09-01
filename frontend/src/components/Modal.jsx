import React from "react";

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
}) => {
    // Support both patterns:
    // 1. Always rendered with isOpen prop controlling visibility
    // 2. Conditionally rendered (no isOpen prop needed)
    if (isOpen === false) return null;

    return (
        <div
            className="modal-overlay"
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px',
            }}
        >
            <div
                className="modal"
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'var(--bg-card, #fff)',
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: '520px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                }}
            >
                <div
                    className="modal-header"
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '20px 24px',
                        borderBottom: '1px solid var(--border, #e5e7eb)',
                    }}
                >
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700' }}>{title}</h3>
                    <button
                        className="modal-close"
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            color: 'var(--text-muted, #9CA3AF)',
                            padding: '4px 8px',
                            borderRadius: '6px',
                        }}
                    >
                        ×
                    </button>
                </div>
                <div className="modal-body" style={{ padding: '24px' }}>
                    {children}
                </div>
                {footer && (
                    <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border, #e5e7eb)' }}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;
