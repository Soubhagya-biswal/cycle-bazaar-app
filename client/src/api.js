import axios from 'axios';

// Create a central Axios instance
const api = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL,
    withCredentials: true, // This is necessary for cookies
});

// This is an 'interceptor' that runs before every request
api.interceptors.request.use(
    async (config) => {
        // Only add the token for methods that change data
        if (['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase())) {
            
            // Get the CSRF token from the backend
            // We'll store it in localStorage to avoid fetching it every time
            let csrfToken = localStorage.getItem('csrfToken');
            
            if (!csrfToken) {
                try {
                    const { data } = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/csrf-token`, {
                        withCredentials: true,
                    });
                    csrfToken = data.csrfToken;
                    localStorage.setItem('csrfToken', csrfToken);
                } catch (error) {
                    console.error('Could not fetch CSRF token:', error);
                    return Promise.reject(error);
                }
            }
            
            // Add the CSRF token to the request headers
            config.headers['csrf-token'] = csrfToken;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;