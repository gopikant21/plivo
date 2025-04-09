
import React from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ServiceStatusBadge } from '@/components/ServiceStatusBadge';
import { useServices } from '@/context/ServiceContext';
import { useIncidents } from '@/context/IncidentContext';

const Index = () => {
  const { services } = useServices();
  const { activeIncidents } = useIncidents();
  const navigate = useNavigate();
  
  // Calculate overall status
  const getOverallStatus = () => {
    if (services.length === 0) return 'operational';
    
    // Check for major outages
    if (services.some(service => service.status === 'major_outage')) {
      return 'major_outage';
    }
    
    // Check for partial outages
    if (services.some(service => service.status === 'partial_outage')) {
      return 'partial_outage';
    }
    
    // Check for degraded performance
    if (services.some(service => service.status === 'degraded_performance')) {
      return 'degraded_performance';
    }
    
    return 'operational';
  };
  
  const overallStatus = getOverallStatus();
  const isFullyOperational = overallStatus === 'operational';

  return (
    <Layout>
      <div className="container mx-auto py-12 space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Status Beacon</h1>
          <p className="text-xl text-muted-foreground">
            Monitor the status of our services in real-time
          </p>
          
          <div className="flex items-center justify-center mt-6">
            <div className="inline-flex items-center px-4 py-2 rounded-lg bg-muted">
              <div className={`h-3 w-3 rounded-full mr-2 ${
                isFullyOperational ? 'bg-emerald-500' : 'bg-amber-500'
              }`}></div>
              <span className="font-medium">
                {isFullyOperational
                  ? 'All systems operational'
                  : 'Some systems experiencing issues'}
              </span>
            </div>
          </div>
          
          <div className="mt-8 flex justify-center">
            <Button onClick={() => navigate('/dashboard')} size="lg">
              View Dashboard
            </Button>
          </div>
        </div>
        
        {activeIncidents.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Active Incidents</h2>
            <div className="space-y-4">
              {activeIncidents.slice(0, 3).map(incident => (
                <div key={incident.id} className="border-b border-amber-200 dark:border-amber-800 pb-4 last:border-0 last:pb-0">
                  <h3 className="font-medium">{incident.name}</h3>
                  <p className="text-sm text-muted-foreground">{incident.message}</p>
                  <div className="mt-2 flex items-center">
                    <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-1 rounded">
                      {incident.status}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      Updated {new Date(incident.updatedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div>
          <h2 className="text-2xl font-bold mb-6">Services Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.length === 0 ? (
              <p className="text-muted-foreground col-span-3 text-center py-10">No services to display</p>
            ) : (
              services.map(service => (
                <div key={service.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">{service.name}</h3>
                    <ServiceStatusBadge status={service.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
        
      </div>
    </Layout>
  );
};

export default Index;
