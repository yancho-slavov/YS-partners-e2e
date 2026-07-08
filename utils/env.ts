function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}. Did you create a .env file from .env.example?`);
  }
  return value;
}

export const env = {
  baseUrl: required('BASE_URL'),
  qaEmail: required('QA_EMAIL'),
  qaPassword: required('QA_PASSWORD'),
};
