import { createContext, useContext, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));

  const getUserEmail = () => {
    if (!accessToken) return null;
    try {
      return jwtDecode(accessToken).sub;
    } catch {
      return null;
    }
  };

  const login = (accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAccessToken(null);
    setRefreshToken(null);
  };

  const getUserRole = () => {
    if (!accessToken) return null;
    try {
        return jwtDecode(accessToken).role;
    } catch {
        return null;
    }
  };

  const isLoggedIn = !!accessToken;
  const userEmail = getUserEmail();
  const userRole = getUserRole();

  return (
    <AuthContext.Provider value={{ accessToken, refreshToken, login, logout, isLoggedIn, userEmail, userRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);