import React, { ReactNode } from "react";

interface WrapperProps {
  children: ReactNode; 
  className?: string;
}

const Wrapper: React.FC<WrapperProps> = ({ children, className = "" }) => {
  return <div className={`flex justify-between  px-6 md:px-10 lg:px-0 max-w-5xl mx-auto ${className}`}>{children}</div>;
};

export default Wrapper;
