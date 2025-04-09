
import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Clock, Info } from 'lucide-react';
import { ServiceStatus } from '@/types';
import { cn } from '@/lib/utils';

interface ServiceStatusBadgeProps {
  status: ServiceStatus;
  withIcon?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ServiceStatusBadge({ 
  status, 
  withIcon = true, 
  className,
  size = 'md'
}: ServiceStatusBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs py-0.5 px-1.5',
    md: 'text-sm py-1 px-2',
    lg: 'text-base py-1.5 px-3'
  };
  
  const getStatusClasses = (status: ServiceStatus) => {
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
  
  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-3.5 w-3.5" />;
      case 'degraded_performance':
        return <AlertTriangle className="h-3.5 w-3.5" />;
      case 'partial_outage':
      case 'major_outage':
        return <XCircle className="h-3.5 w-3.5" />;
      case 'maintenance':
        return <Clock className="h-3.5 w-3.5" />;
      default:
        return <Info className="h-3.5 w-3.5" />;
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

  return (
    <span className={cn(
      'inline-flex items-center rounded-full border font-medium',
      sizeClasses[size],
      getStatusClasses(status),
      className
    )}>
      {withIcon && (
        <span className="mr-1">
          {getStatusIcon(status)}
        </span>
      )}
      {getStatusText(status)}
    </span>
  );
}
