import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Service, ServiceStatus, ApiResponse } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface ServiceContextType {
  services: Service[];
  isLoading: boolean;
  error: string | null;
  fetchServices: () => Promise<void>;
  createService: (service: Partial<Service>) => Promise<Service | null>;
  updateService: (id: string, service: Partial<Service>) => Promise<Service | null>;
  deleteService: (id: string) => Promise<boolean>;
  updateServiceStatus: (id: string, status: ServiceStatus) => Promise<boolean>;
  getServiceById: (id: string) => Service | undefined;
  groupedServices: Record<string, Service[]>;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export function ServiceProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const mockServices: Service[] = [
    {
      id: '1',
      name: 'API',
      description: 'Main API Service',
      group: 'Core Services',
      status: 'operational',
      isPublic: true,
      organization: '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Database',
      description: 'Primary Database',
      group: 'Core Services',
      status: 'operational',
      isPublic: true,
      organization: '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Web App',
      description: 'Customer Dashboard',
      group: 'Customer Facing',
      status: 'degraded_performance',
      isPublic: true,
      organization: '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '4',
      name: 'Admin Panel',
      description: 'Internal Admin Tools',
      group: 'Internal Tools',
      status: 'operational',
      isPublic: false,
      organization: '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '5',
      name: 'Marketing Site',
      description: 'Company Website',
      group: 'Customer Facing',
      status: 'major_outage',
      isPublic: true,
      organization: '1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const fetchServices = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // For demo purpose, use mock data instead of actual API call
      // In a real app, you would make a fetch request to your API
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/services`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data: ApiResponse<Service[]> = await response.json();
      if (data.success && data.data) {
        setServices(data.data);
      } else {
        setError(data.message || 'Failed to fetch services');
      }
      
      
      // Using mock data
      setTimeout(() => {
        setServices(mockServices);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching services:', error);
      setError('Failed to fetch services. Please try again.');
      setIsLoading(false);
    }
  };

  const createService = async (service: Partial<Service>): Promise<Service | null> => {
    if (!token) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // For demo purpose, simulate creating a service
      const newService: Service = {
        id: Math.random().toString(36).substr(2, 9),
        name: service.name || 'Untitled Service',
        description: service.description || '',
        group: service.group || 'Uncategorized',
        status: service.status || 'operational',
        isPublic: service.isPublic !== undefined ? service.isPublic : true,
        organization: '1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setServices(prev => [...prev, newService]);
      toast.success('Service created successfully');
      return newService;
    } catch (error) {
      console.error('Error creating service:', error);
      setError('Failed to create service. Please try again.');
      toast.error('Failed to create service');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateService = async (id: string, serviceUpdate: Partial<Service>): Promise<Service | null> => {
    if (!token) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // For demo purpose, simulate updating a service
      const updatedServices = services.map(service => {
        if (service.id === id) {
          return {
            ...service,
            ...serviceUpdate,
            updatedAt: new Date().toISOString()
          };
        }
        return service;
      });
      
      setServices(updatedServices);
      const updatedService = updatedServices.find(s => s.id === id);
      toast.success('Service updated successfully');
      return updatedService || null;
    } catch (error) {
      console.error('Error updating service:', error);
      setError('Failed to update service. Please try again.');
      toast.error('Failed to update service');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteService = async (id: string): Promise<boolean> => {
    if (!token) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // For demo purpose, simulate deleting a service
      setServices(prev => prev.filter(service => service.id !== id));
      toast.success('Service deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting service:', error);
      setError('Failed to delete service. Please try again.');
      toast.error('Failed to delete service');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateServiceStatus = async (id: string, status: ServiceStatus): Promise<boolean> => {
    if (!token) return false;
    
    try {
      // For demo purpose, simulate updating a service status
      const updatedServices = services.map(service => {
        if (service.id === id) {
          return {
            ...service,
            status,
            updatedAt: new Date().toISOString()
          };
        }
        return service;
      });
      
      setServices(updatedServices);
      toast.success('Service status updated');
      return true;
    } catch (error) {
      console.error('Error updating service status:', error);
      toast.error('Failed to update service status');
      return false;
    }
  };

  const getServiceById = (id: string): Service | undefined => {
    return services.find(service => service.id === id);
  };

  // Group services by their group property
  const groupedServices = services.reduce<Record<string, Service[]>>((acc, service) => {
    const group = service.group || 'Uncategorized';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(service);
    return acc;
  }, {});

  // Fetch services when token is available
  useEffect(() => {
    if (token) {
      fetchServices();
    }
  }, [token]);

  return (
    <ServiceContext.Provider value={{
      services,
      isLoading,
      error,
      fetchServices,
      createService,
      updateService,
      deleteService,
      updateServiceStatus,
      getServiceById,
      groupedServices
    }}>
      {children}
    </ServiceContext.Provider>
  );
}

export function useServices() {
  const context = useContext(ServiceContext);
  if (context === undefined) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return context;
}
