
import React from 'react';
import { Layout } from '@/components/Layout';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';

const Dashboard = () => {
  return (
    <Layout title="Dashboard">
      <DashboardOverview />
    </Layout>
  );
};

export default Dashboard;
