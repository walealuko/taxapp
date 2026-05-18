import React, { useState, useEffect } from 'react';
import { View, Platform, ViewProps } from 'react-native';

interface FormProps extends ViewProps {
  children: React.ReactNode;
  onSubmit: () => void;
}

export const Form = ({ children, onSubmit, style, ...props }: FormProps) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (Platform.OS === 'web' && isMounted) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        style={style}
        {...props}
      >
        {children}
      </form>
    );
  }

  return <View style={style} {...props}>{children}</View>;
};
