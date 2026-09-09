// Bind and address the backend by IPv4 literal. On Windows `localhost`
// resolves to ::1 first, which a 127.0.0.1 listener never answers.
export const API_BASE_URL = 'http://127.0.0.1:8000'
