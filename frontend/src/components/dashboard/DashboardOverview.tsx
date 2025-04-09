
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  AlertCircle, 
  Calendar, 
  Clock, 
  Plus,
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  InfoIcon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useServices } from '@/context/ServiceContext';
import { useIncidents } from '@/context/IncidentContext';
import { ServiceStatus } from '@/types';

export function DashboardOverview() {
  const navigate = useNavigate();
  const { services, isLoading: servicesLoading } = useServices();
  const { activeIncidents, incidents, isLoading: incidentsLoading } = useIncidents();
  
  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return 'text-success';
      case 'degraded_performance':
        return 'text-warning';
      case 'partial_outage':
      case 'major_outage':
        return 'text-destructive';
      case 'maintenance':
        return 'text-blue-500';
      default:
        return 'text-muted-foreground';
    }
  };
  
  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'degraded_performance':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'partial_outage':
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'major_outage':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'maintenance':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <InfoIcon className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return 'Operational';
      case 'degraded_performance':
        return 'Degraded Performance';
      case 'partial_outage':
        return 'Partial Outage';
      case 'major_outage':
        return 'Major Outage';
      case 'maintenance':
        return 'Maintenance';
      default:
        return 'Unknown';
    }
  };

  const operationalCount = services.filter(s => s.status === 'operational').length;
  const degradedCount = services.filter(s => s.status === 'degraded_performance').length;
  const outageCount = services.filter(s => s.status === 'partial_outage' || s.status === 'major_outage').length;
  const maintenanceCount = services.filter(s => s.status === 'maintenance').length;
  
  const resolvedIncidents = incidents.filter(i => i.status === 'resolved').length;
  const totalIncidents = incidents.length;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of your services and incidents
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => navigate('/services/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Service
          </Button>
          <Button variant="outline" onClick={() => navigate('/incidents/new')}>
            <AlertCircle className="mr-2 h-4 w-4" />
            Report Incident
          </Button>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Operational
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operationalCount}</div>
            <p className="text-xs text-muted-foreground">
              services running normally
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Degraded
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{degradedCount}</div>
            <p className="text-xs text-muted-foreground">
              services with performance issues
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Outages
            </CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outageCount}</div>
            <p className="text-xs text-muted-foreground">
              services experiencing outages
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Incidents
            </CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeIncidents.length}</div>
            <p className="text-xs text-muted-foreground">
              open incidents being tracked
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Status Overview
            </CardTitle>
            <CardDescription>
              Current status of your services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {servicesLoading ? (
              <div className="flex justify-center p-4">
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-4">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded"></div>
                  </div>
                </div>
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No services found</p>
                <Button variant="link" onClick={() => navigate('/services/new')}>
                  Add your first service
                </Button>
              </div>
            ) : (
              services.slice(0, 5).map((service) => (
                <div key={service.id} className="flex items-center justify-between border-b last:border-b-0 py-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(service.status)}
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-xs text-muted-foreground">{service.group}</p>
                    </div>
                  </div>
                  <span className={`text-sm ${getStatusColor(service.status)}`}>
                    {getStatusText(service.status)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => navigate('/services')}>
              View All Services
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              Recent Incidents
            </CardTitle>
            <CardDescription>
              Latest incidents affecting your services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {incidentsLoading ? (
              <div className="flex justify-center p-4">
                <div className="animate-pulse flex space-x-4">
                  <div className="flex-1 space-y-4">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded"></div>
                  </div>
                </div>
              </div>
            ) : incidents.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No incidents reported</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your services are running smoothly
                </p>
              </div>
            ) : (
              incidents.slice(0, 3).map((incident) => (
                <div key={incident.id} className="border-b last:border-b-0 py-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{incident.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      incident.status === 'resolved' 
                        ? 'bg-success/10 text-success' 
                        : 'bg-destructive/10 text-destructive'
                    }`}>
                      {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(incident.updatedAt).toLocaleString()}
                  </p>
                  <p className="text-sm mt-1">{incident.updates[0]?.message || incident.message}</p>
                </div>
              ))
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => navigate('/incidents')}>
              View All Incidents
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Upcoming Maintenance
            </CardTitle>
            <CardDescription>
              Scheduled maintenance events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <Clock className="mx-auto h-10 w-10 text-muted-foreground opacity-50" />
              <p className="mt-2 text-muted-foreground">No maintenance scheduled</p>
              <Button variant="link" onClick={() => navigate('/maintenance/new')}>
                Schedule Maintenance
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Incident Statistics</CardTitle>
            <CardDescription>
              Overview of incident resolution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <p className="text-muted-foreground">Total Incidents</p>
                  <p className="font-medium">{totalIncidents}</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <p className="text-muted-foreground">Resolved</p>
                  <p className="font-medium">{resolvedIncidents}</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <p className="text-muted-foreground">Active</p>
                  <p className="font-medium">{activeIncidents.length}</p>
                </div>
              </div>
              
              <div className="relative pt-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-medium text-muted-foreground">
                    Resolution Rate
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">
                    {totalIncidents > 0 ? Math.round((resolvedIncidents / totalIncidents) * 100) : 0}%
                  </div>
                </div>
                <div className="overflow-hidden h-2 text-xs flex rounded bg-muted">
                  <div 
                    style={{ 
                      width: totalIncidents > 0 ? `${(resolvedIncidents / totalIncidents) * 100}%` : '0%' 
                    }}
                    className="bg-primary flex flex-col text-center whitespace-nowrap text-white justify-center"
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
