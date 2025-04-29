export const getApiUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://192.168.1.197:3500/api';
  }
  return 'https://fido-api.torama.ng/api';
}; 