import React from 'react';
import { View, Platform, ViewProps } from 'react-native';

interface FormProps extends ViewProps {
  children: React.ReactNode;
  onSubmit: () => void;
}

export const Form = ({ children, onSubmit, ...props }: FormProps) => {
  if (Platform.OS === 'web') {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        {...props}
      >
        {children}
      </form>
    );
  }
  return <View {...props}>{children}</View>;
};
