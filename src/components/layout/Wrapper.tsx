import React, { ReactNode } from "react";

interface WrapperProps {
  children: ReactNode; 
  className?: string;
}

const Wrapper: React.FC<WrapperProps> = ({ children, className = "" }) => {
  return <div className={`flex justify-between px-30 ${className}`}>{children}</div>;
};

export default Wrapper;
