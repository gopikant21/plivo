
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { IncidentCard } from '@/components/incidents/IncidentCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Plus } from 'lucide-react';
import { useIncidents } from '@/context/IncidentContext';

const Incidents = () => {
  const { incidents, activeIncidents, isLoading } = useIncidents();
  const navigate = useNavigate();
  
  const resolvedIncidents = incidents.filter(incident => incident.status === 'resolved');

  return (
    <Layout title="Incidents">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Incident Management</h1>
        <Button onClick={() => navigate('/incidents/new')}>
          <AlertCircle className="h-4 w-4 mr-2" /> Report Incident
        </Button>
      </div>
      
      <Tabs defaultValue="active">
        <TabsList className="mb-6">
          <TabsTrigger value="active">
            Active Incidents
            {activeIncidents.length > 0 && (
              <span className="ml-2 bg-primary/20 text-primary rounded-full px-2 py-0.5 text-xs">
                {activeIncidents.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="resolved">Resolved Incidents</TabsTrigger>
          <TabsTrigger value="all">All Incidents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-12 bg-muted rounded"></div>
                    <div className="h-8 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : activeIncidents.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/5">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6 text-success"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold">All Systems Operational</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
                There are no active incidents. All services are running normally.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeIncidents.map(incident => (
                <IncidentCard key={incident.id} incident={incident} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="resolved">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-12 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : resolvedIncidents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No resolved incidents yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {resolvedIncidents.map(incident => (
                <IncidentCard key={incident.id} incident={incident} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="all">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-12 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No incidents have been reported</p>
              <Button variant="link" onClick={() => navigate('/incidents/new')}>
                Report your first incident
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {incidents.map(incident => (
                <IncidentCard key={incident.id} incident={incident} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default Incidents;
