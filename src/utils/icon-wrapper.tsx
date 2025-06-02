import React, { forwardRef } from 'react';
import { IconType } from 'react-icons';

// This component wraps react-icons with forwardRef to avoid the warning:
// "Function components cannot be given refs"
export const IconWrapper = forwardRef<HTMLElement, { icon: IconType, [key: string]: any }>(
  ({ icon: IconComponent, ...rest }, ref) => {
    return <IconComponent ref={ref} {...rest} />;
  }
);

IconWrapper.displayName = 'IconWrapper';