export const getApiUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3500/api';
  }
  return 'https://fido-api.torama.ng/api';
}; 