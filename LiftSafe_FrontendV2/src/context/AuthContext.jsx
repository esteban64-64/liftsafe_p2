import { createContext, useContext, useState } from 'react';
import { canDo } from '../config/roles';
import { loginRequest, registerRequest } from '../services/authService';

const AuthContext = createContext(null);

function buildUserFromLogin(data, correo) {
  return {
    name: data.nombre,
    email: correo,
    role: data.rol,
    token: data.access_token,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('liftsafe_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email, password) => {
    try {
      const data = await loginRequest(email, password);
      const userData = buildUserFromLogin(data, email);
      localStorage.setItem('liftsafe_user', JSON.stringify(userData));
      localStorage.setItem('liftsafe_token', data.access_token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Correo o contraseña incorrectos' };
    }
  };

  const register = async (formData) => {
    try {
      await registerRequest(formData);
      const loginResult = await login(formData.email, formData.password);
      if (!loginResult.success) {
        return { success: true, message: 'Cuenta creada. Inicia sesión con tus credenciales.' };
      }
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'No se pudo registrar el usuario' };
    }
  };

  const logout = () => {
    localStorage.removeItem('liftsafe_user');
    localStorage.removeItem('liftsafe_token');
    setUser(null);
  };

  const hasAction = (action) => canDo(user?.role, action);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, hasAction }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
