import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-16 w-auto',
    xl: 'h-20 w-auto'
  };

  return (
    <img 
      src="/Ministry_of_Innovation_and_Technology_(Ethiopia).png" 
      alt="Ministry of Innovation and Technology" 
      className={`${sizeClasses[size]} ${className}`}
    />
  );
};

export default Logo;
