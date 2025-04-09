
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { ServiceCard } from '@/components/services/ServiceCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useServices } from '@/context/ServiceContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Services = () => {
  const { groupedServices, isLoading } = useServices();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const allGroups = Object.keys(groupedServices);
  
  const filteredGroups = Object.entries(groupedServices).map(([group, services]) => {
    return {
      group,
      services: services.filter(service => 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    };
  }).filter(({ services }) => services.length > 0);

  return (
    <Layout title="Services">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Service Management</h1>
        <div className="flex items-center w-full md:w-auto gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search services..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => navigate('/services/new')}>
            <Plus className="h-4 w-4 mr-2" /> Add Service
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
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
      ) : allGroups.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No services found</h3>
          <p className="text-muted-foreground mb-6">
            Add your first service to start monitoring its status.
          </p>
          <Button onClick={() => navigate('/services/new')}>
            <Plus className="h-4 w-4 mr-2" /> Add Service
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Services</TabsTrigger>
            {allGroups.map(group => (
              <TabsTrigger key={group} value={group}>{group}</TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all">
            {searchQuery && filteredGroups.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No services match your search</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGroups.map(({ group, services }) => (
                  services.map(service => (
                    <ServiceCard key={service.id} service={service} />
                  ))
                ))}
              </div>
            )}
          </TabsContent>
          
          {allGroups.map(group => (
            <TabsContent key={group} value={group}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedServices[group]
                  .filter(service => 
                    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    service.description.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(service => (
                    <ServiceCard key={service.id} service={service} />
                  ))
                }
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </Layout>
  );
};

export default Services;
