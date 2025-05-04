import React from 'react';
import PropTypes from 'prop-types';
import styles from './SplitRow.module.css';

/**
 * Two-column row that shares height but allows any column-width ratio.
 *
 *   <SplitRow leftWidth="70%" rightWidth="30%" height="70%">
 *     <LineChart … />
 *     <ShakeMap  … />
 *   </SplitRow>
 */
const SplitRow = ({
  children,
  leftWidth = '70%',
  rightWidth = '30%',
  gap = '16px',
  height = '100%',
  style = {},
  ...rest
}) => {
  const [left, right] = React.Children.toArray(children);     // enforce 2 children
  return (
    <div
      className={styles.row}
      style={{
        '--left':  leftWidth,
        '--right': rightWidth,
        '--gap':   gap,
        '--h':     height,
        ...style,
      }}
      {...rest}
    >
      {left}
      {right}
    </div>
  );
};

SplitRow.propTypes = {
  /** First child (left column)  */ leftWidth:  PropTypes.string,
  /** Second child (right col.) */ rightWidth: PropTypes.string,
  /** Row height (any CSS unit) */ height:     PropTypes.string,
  gap:        PropTypes.string,
  children:   PropTypes.node.isRequired,
  style:      PropTypes.object,
};

export default SplitRow;
