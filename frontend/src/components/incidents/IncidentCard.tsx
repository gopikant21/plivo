
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertCircle, CheckCircle, Clock, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useIncidents } from '@/context/IncidentContext';
import { useServices } from '@/context/ServiceContext';
import { Incident, IncidentStatus } from '@/types';

interface IncidentCardProps {
  incident: Incident;
}

export function IncidentCard({ incident }: IncidentCardProps) {
  const navigate = useNavigate();
  const { addIncidentUpdate, deleteIncident } = useIncidents();
  const { services } = useServices();
  
  const getStatusIcon = (status: IncidentStatus) => {
    switch (status) {
      case 'investigating':
        return <Activity className="h-5 w-5" />;
      case 'identified':
        return <AlertCircle className="h-5 w-5" />;
      case 'monitoring':
        return <Clock className="h-5 w-5" />;
      case 'resolved':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case 'investigating':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500';
      case 'identified':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-500';
      case 'monitoring':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'minor':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500';
      case 'major':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-500';
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  const affectedServices = services.filter(s => incident.services.includes(s.id));

  const updateToNextStatus = async () => {
    let nextStatus: IncidentStatus = 'resolved';
    let statusMessage = '';
    
    switch (incident.status) {
      case 'investigating':
        nextStatus = 'identified';
        statusMessage = 'The cause of the incident has been identified.';
        break;
      case 'identified':
        nextStatus = 'monitoring';
        statusMessage = 'The fix has been implemented and we are monitoring the results.';
        break;
      case 'monitoring':
        nextStatus = 'resolved';
        statusMessage = 'The incident has been resolved and services are back to normal.';
        break;
      default:
        return;
    }
    
    await addIncidentUpdate(incident.id, {
      status: nextStatus,
      message: statusMessage,
      notify: true
    });
  };
  
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete the incident "${incident.name}"?`)) {
      await deleteIncident(incident.id);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{incident.name}</h3>
            <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(incident.status)}`}>
              {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {formatDate(incident.createdAt)}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/incidents/${incident.id}`)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/incidents/${incident.id}/update`)}>
              Add Update
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              Delete Incident
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1 mb-3">
          <Badge variant="outline" className={getImpactColor(incident.impact)}>
            {incident.impact.charAt(0).toUpperCase() + incident.impact.slice(1)} Impact
          </Badge>
          {affectedServices.map(service => (
            <Badge key={service.id} variant="outline">
              {service.name}
            </Badge>
          ))}
        </div>
        <p className="text-sm">{incident.message}</p>
        
        {incident.updates.length > 1 && (
          <div className="mt-4 border-t pt-2">
            <h4 className="text-sm font-medium mb-2">Latest Update</h4>
            <div className="text-sm">
              <div className="flex items-center mb-1">
                <span className="text-muted-foreground mr-2">
                  {formatDate(incident.updates[0].createdAt)}
                </span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(incident.updates[0].status)}`}>
                  {incident.updates[0].status.charAt(0).toUpperCase() + incident.updates[0].status.slice(1)}
                </span>
              </div>
              <p>{incident.updates[0].message}</p>
            </div>
          </div>
        )}
      </CardContent>
      {incident.status !== 'resolved' && (
        <CardFooter>
          <Button 
            onClick={updateToNextStatus} 
            className="w-full"
            variant="outline"
          >
            {getStatusIcon(
              incident.status === 'investigating'
                ? 'identified'
                : incident.status === 'identified'
                ? 'monitoring'
                : 'resolved'
            )}
            <span className="ml-2">
              {incident.status === 'investigating'
                ? 'Mark as Identified'
                : incident.status === 'identified'
                ? 'Start Monitoring'
                : 'Mark as Resolved'}
            </span>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
