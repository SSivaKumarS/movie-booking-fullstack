import { Navigate } from "react-router-dom";

/**
 * PrivateRoute — wraps protected pages.
 * Redirects to /login if the user is not authenticated.
 */
function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  if (!token || !userId) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default PrivateRoute;
