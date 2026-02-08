import React from 'react';
import PropTypes from 'prop-types';
import './Pagination.css';

const Pagination = ({ page, total, pageSize = 10, onPageChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  const goTo = (next) => {
    const val = Math.min(totalPages, Math.max(1, next));
    onPageChange(val);
  };

  return (
    <div className="pagination">
      <button className="page-btn" onClick={() => goTo(page - 1)} disabled={page === 1}>‹</button>
      <span className="page-info">{start}-{end} de {total}</span>
      <button className="page-btn" onClick={() => goTo(page + 1)} disabled={page === totalPages}>›</button>
    </div>
  );
};

Pagination.propTypes = {
  page: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  pageSize: PropTypes.number,
  onPageChange: PropTypes.func.isRequired,
};

export default Pagination;
