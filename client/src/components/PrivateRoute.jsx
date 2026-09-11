// frontend/src/components/PrivateRoute.jsx
import { useContext } from 'react';
import { Navigate, Route } from 'react-router-dom';
import UserContext from '../context/UserContext';

const PrivateRoute = ({ element, ...rest }) => {
  const { isAuthenticated } = useContext(UserContext);

  return isAuthenticated ? (
    <Route {...rest} element={element} />
  ) : (
    <Navigate to="/login" replace />
  );
};

export default PrivateRoute;