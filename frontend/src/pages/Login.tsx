
import React from 'react';
import { Layout } from '@/components/Layout';
import { LoginForm } from '@/components/auth/LoginForm';

const Login = () => {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </Layout>
  );
};

export default Login;
