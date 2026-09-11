import React, { createContext, useContext, useState, useEffect } from 'react';
import Loader from '../components/Loader';

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Listen for loading state changes from the API
    const handleLoadingStateChange = (event) => {
      setIsLoading(event.detail.isLoading);
    };

    window.addEventListener('api-loading-state-change', handleLoadingStateChange);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('api-loading-state-change', handleLoadingStateChange);
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ setIsLoading }}>
      {isLoading && <Loader />}
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}; 