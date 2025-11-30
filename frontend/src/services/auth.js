import api from './api';

export const authService = {
  login: (username, password) => 
    api.post('/usuarios/login/', { username, password }),
  
  logout: () => 
    api.post('/usuarios/logout/'),
  
  getCurrentUser: () => 
    api.get('/usuarios/usuario-actual/'),
};



