
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock,
  MoreHorizontal,
  InfoIcon
} from 'lucide-react';
import { useServices } from '@/context/ServiceContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Service, ServiceStatus } from '@/types';

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const navigate = useNavigate();
  const { updateServiceStatus, deleteService } = useServices();
  
  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'degraded_performance':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'partial_outage':
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

  const getStatusClass = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return 'status-operational';
      case 'degraded_performance':
        return 'status-degraded';
      case 'partial_outage':
      case 'major_outage':
        return 'status-outage';
      case 'maintenance':
        return 'status-maintenance';
      default:
        return 'border-muted text-muted-foreground';
    }
  };

  const handleStatusChange = async (status: ServiceStatus) => {
    await updateServiceStatus(service.id, status);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete the service "${service.name}"?`)) {
      await deleteService(service.id);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">{service.name}</CardTitle>
          <CardDescription>{service.group}</CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/services/${service.id}`)}>
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/services/${service.id}/edit`)}>
              Edit Service
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/incidents/new?service=${service.id}`)}>
              Report Incident
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              Delete Service
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          {getStatusIcon(service.status)}
          <div className={`text-sm font-medium ${service.status === 'operational' ? 'text-success' : ''}`}>
            {getStatusText(service.status)}
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {service.description}
        </p>
      </CardContent>
      <CardFooter>
        <div className="w-full">
          <div className="text-xs text-muted-foreground mb-2">Update Status:</div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className={service.status === 'operational' ? 'bg-success/10 border-success/20' : ''}
              onClick={() => handleStatusChange('operational')}
            >
              <CheckCircle className="mr-1 h-3 w-3" /> Operational
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={service.status === 'degraded_performance' ? 'bg-warning/10 border-warning/20' : ''}
              onClick={() => handleStatusChange('degraded_performance')}
            >
              <AlertTriangle className="mr-1 h-3 w-3" /> Degraded
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={service.status === 'major_outage' ? 'bg-destructive/10 border-destructive/20' : ''}
              onClick={() => handleStatusChange('major_outage')}
            >
              <XCircle className="mr-1 h-3 w-3" /> Outage
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
