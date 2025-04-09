import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Incident, IncidentStatus, IncidentImpact, ApiResponse, IncidentUpdate } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface IncidentContextType {
  incidents: Incident[];
  activeIncidents: Incident[];
  isLoading: boolean;
  error: string | null;
  fetchIncidents: () => Promise<void>;
  createIncident: (incident: Partial<Incident>) => Promise<Incident | null>;
  updateIncident: (id: string, incident: Partial<Incident>) => Promise<Incident | null>;
  deleteIncident: (id: string) => Promise<boolean>;
  addIncidentUpdate: (
    id: string, 
    update: { status: IncidentStatus; message: string; notify?: boolean }
  ) => Promise<Incident | null>;
  getIncidentById: (id: string) => Incident | undefined;
}

const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

export function IncidentProvider({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { token, user } = useAuth();

  const mockIncidents: Incident[] = [
    {
      id: '1',
      name: 'API Performance Issues',
      status: 'investigating',
      impact: 'minor',
      services: ['1'],
      message: 'We are investigating reports of slow API response times.',
      updates: [
        {
          id: '101',
          status: 'investigating',
          message: 'We are investigating reports of slow API response times.',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          createdBy: '1'
        }
      ],
      organization: '1',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: '2',
      name: 'Marketing Website Outage',
      status: 'identified',
      impact: 'major',
      services: ['5'],
      message: 'The marketing website is currently down. Our team has identified the issue and is working on a fix.',
      updates: [
        {
          id: '201',
          status: 'investigating',
          message: 'We are investigating reports that the marketing website is not loading.',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          createdBy: '1'
        },
        {
          id: '202',
          status: 'identified',
          message: 'The issue has been identified as a server misconfiguration. We are working on a fix.',
          createdAt: new Date(Date.now() - 79200000).toISOString(),
          createdBy: '1'
        }
      ],
      organization: '1',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 79200000).toISOString()
    },
    {
      id: '3',
      name: 'Dashboard Performance Issues',
      status: 'resolved',
      impact: 'minor',
      services: ['3'],
      message: 'The dashboard was experiencing slow load times. This has now been resolved.',
      updates: [
        {
          id: '301',
          status: 'investigating',
          message: 'We are investigating reports of slow dashboard performance.',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          createdBy: '1'
        },
        {
          id: '302',
          status: 'identified',
          message: 'We have identified the cause as a database query issue.',
          createdAt: new Date(Date.now() - 169200000).toISOString(),
          createdBy: '1'
        },
        {
          id: '303',
          status: 'resolved',
          message: 'The issue has been resolved by optimizing our database queries.',
          createdAt: new Date(Date.now() - 165600000).toISOString(),
          createdBy: '1'
        }
      ],
      organization: '1',
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date(Date.now() - 165600000).toISOString()
    }
  ];

  const fetchIncidents = async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      setTimeout(() => {
        setIncidents(mockIncidents);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      setError('Failed to fetch incidents. Please try again.');
      setIsLoading(false);
    }
  };

  const createIncident = async (incident: Partial<Incident>): Promise<Incident | null> => {
    if (!token || !user) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const initialUpdate: IncidentUpdate = {
        id: Math.random().toString(36).substr(2, 9),
        status: incident.status || 'investigating',
        message: incident.message || '',
        createdAt: new Date().toISOString(),
        createdBy: user.id
      };

      const newIncident: Incident = {
        id: Math.random().toString(36).substr(2, 9),
        name: incident.name || 'Untitled Incident',
        status: incident.status || 'investigating',
        impact: incident.impact || 'minor',
        services: incident.services || [],
        message: incident.message || '',
        updates: [initialUpdate],
        organization: '1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setIncidents(prev => [newIncident, ...prev]);
      toast.success('Incident created successfully');
      return newIncident;
    } catch (error) {
      console.error('Error creating incident:', error);
      setError('Failed to create incident. Please try again.');
      toast.error('Failed to create incident');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateIncident = async (id: string, incidentUpdate: Partial<Incident>): Promise<Incident | null> => {
    if (!token) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedIncidents = incidents.map(incident => {
        if (incident.id === id) {
          return {
            ...incident,
            ...incidentUpdate,
            updatedAt: new Date().toISOString()
          };
        }
        return incident;
      });
      
      setIncidents(updatedIncidents);
      const updatedIncident = updatedIncidents.find(i => i.id === id);
      toast.success('Incident updated successfully');
      return updatedIncident || null;
    } catch (error) {
      console.error('Error updating incident:', error);
      setError('Failed to update incident. Please try again.');
      toast.error('Failed to update incident');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteIncident = async (id: string): Promise<boolean> => {
    if (!token) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      setIncidents(prev => prev.filter(incident => incident.id !== id));
      toast.success('Incident deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting incident:', error);
      setError('Failed to delete incident. Please try again.');
      toast.error('Failed to delete incident');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const addIncidentUpdate = async (
    id: string, 
    update: { status: IncidentStatus; message: string; notify?: boolean }
  ): Promise<Incident | null> => {
    if (!token || !user) return null;
    
    try {
      const updatedIncidents = incidents.map(incident => {
        if (incident.id === id) {
          const newUpdate: IncidentUpdate = {
            id: Math.random().toString(36).substr(2, 9),
            status: update.status,
            message: update.message,
            createdAt: new Date().toISOString(),
            createdBy: user.id
          };
          
          return {
            ...incident,
            status: update.status,
            updates: [newUpdate, ...incident.updates],
            updatedAt: new Date().toISOString()
          };
        }
        return incident;
      });
      
      setIncidents(updatedIncidents);
      const updatedIncident = updatedIncidents.find(i => i.id === id);
      toast.success('Incident update added');
      
      if (update.notify) {
        toast.info('Notifications sent to subscribers');
      }
      
      return updatedIncident || null;
    } catch (error) {
      console.error('Error adding incident update:', error);
      toast.error('Failed to add incident update');
      return null;
    }
  };

  const getIncidentById = (id: string): Incident | undefined => {
    return incidents.find(incident => incident.id === id);
  };

  useEffect(() => {
    if (token) {
      fetchIncidents();
    }
  }, [token]);

  const activeIncidents = incidents.filter(incident => incident.status !== 'resolved');

  return (
    <IncidentContext.Provider value={{
      incidents,
      activeIncidents,
      isLoading,
      error,
      fetchIncidents,
      createIncident,
      updateIncident,
      deleteIncident,
      addIncidentUpdate,
      getIncidentById
    }}>
      {children}
    </IncidentContext.Provider>
  );
}

export function useIncidents() {
  const context = useContext(IncidentContext);
  if (context === undefined) {
    throw new Error('useIncidents must be used within an IncidentProvider');
  }
  return context;
}
