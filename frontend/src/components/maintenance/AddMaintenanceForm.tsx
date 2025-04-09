import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { toast } from "@/components/ui/use-toast";

// Define the maintenance schema
const maintenanceSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]),
  services: z.array(z.string()).nonempty({ message: "Select at least one service" }),
  scheduledStartTime: z.date(),
  scheduledEndTime: z.date(),
  description: z.string().min(5, { message: "Description must be at least 5 characters" }),
  notify: z.boolean().default(true),
});

// Define the maintenance form data type based on the schema
type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

interface Service {
  _id: string;
  name: string;
}

interface AddMaintenanceFormProps {
  onSuccess?: (data: any) => void;
  onCancel?: () => void;
}

const AddMaintenanceForm: React.FC<AddMaintenanceFormProps> = ({ onSuccess, onCancel }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      name: "",
      status: "scheduled",
      services: [],
      scheduledStartTime: new Date(Date.now() + 86400000), // Tomorrow
      scheduledEndTime: new Date(Date.now() + 86400000 + 7200000), // Tomorrow + 2 hours
      description: "",
      notify: true,
    },
  });

  // Fetch services when component mounts
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch services");
        }

        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setServices(result.data);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
        toast({
          title: "Error",
          description: "Failed to load services. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchServices();
  }, []);

  const onSubmit = async (data: MaintenanceFormData) => {
    setIsLoading(true);
    try {
      // Get the token from localStorage
      const token = localStorage.getItem("token");
      
      // Format dates as ISO strings for the API
      const formattedData = {
        ...data,
        scheduledStartTime: data.scheduledStartTime.toISOString(),
        scheduledEndTime: data.scheduledEndTime.toISOString(),
      };
      
      // Make the API call to create the maintenance
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/maintenance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formattedData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create maintenance");
      }

      // Show success message
      toast({
        title: "Maintenance scheduled",
        description: "The maintenance has been scheduled successfully.",
      });

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess(result.data);
      }
    } catch (error) {
      console.error("Error creating maintenance:", error);
      // Show error message
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create maintenance",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Schedule Maintenance</CardTitle>
        <CardDescription>
          Plan and announce upcoming maintenance for your services
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maintenance Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Database Upgrade" {...field} />
                  </FormControl>
                  <FormDescription>
                    A concise name for this maintenance event
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="We will be performing a database upgrade to improve performance."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Explain the maintenance purpose and potential impact
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="services"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Affected Services</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value.length && "text-muted-foreground"
                          )}
                        >
                          {field.value.length > 0
                            ? `${field.value.length} service${field.value.length > 1 ? "s" : ""} selected`
                            : "Select services"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search services..." />
                        <CommandEmpty>No services found.</CommandEmpty>
                        <CommandGroup>
                          {services.map((service) => (
                            <CommandItem
                              value={service.name}
                              key={service._id}
                              onSelect={() => {
                                const currentValues = new Set(field.value);
                                if (currentValues.has(service._id)) {
                                  currentValues.delete(service._id);
                                } else {
                                  currentValues.add(service._id);
                                }
                                field.onChange(Array.from(currentValues));
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  field.value.includes(service._id) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {service.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Select the services that will be affected by this maintenance
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="scheduledStartTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP HH:mm")
                            ) : (
                              <span>Select date and time</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            if (date) {
                              const currentDate = field.value || new Date();
                              date.setHours(currentDate.getHours());
                              date.setMinutes(currentDate.getMinutes());
                              field.onChange(date);
                            }
                          }}
                          initialFocus
                        />
                        <div className="border-t p-3 flex justify-between">
                          <div>
                            <Input
                              type="time"
                              value={field.value ? format(field.value, "HH:mm") : ""}
                              onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(':').map(Number);
                                const newDate = new Date(field.value || new Date());
                                newDate.setHours(hours);
                                newDate.setMinutes(minutes);
                                field.onChange(newDate);
                              }}
                              className="w-24"
                            />
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              const popoverTrigger = document.querySelector('[role="combobox"]');
                              if (popoverTrigger instanceof HTMLElement) {
                                popoverTrigger.click();
                              }
                            }}
                          >
                            Done
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When the maintenance will begin
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduledEndTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP HH:mm")
                            ) : (
                              <span>Select date and time</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            if (date) {
                              const currentDate = field.value || new Date();
                              date.setHours(currentDate.getHours());
                              date.setMinutes(currentDate.getMinutes());
                              field.onChange(date);
                            }
                          }}
                          initialFocus
                        />
                        <div className="border-t p-3 flex justify-between">
                          <div>
                            <Input
                              type="time"
                              value={field.value ? format(field.value, "HH:mm") : ""}
                              onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(':').map(Number);
                                const newDate = new Date(field.value || new Date());
                                newDate.setHours(hours);
                                newDate.setMinutes(minutes);
                                field.onChange(newDate);
                              }}
                              className="w-24"
                            />
                          </div>
                          <Button
                            size="sm"
                            onClick={() => {
                              const popoverTrigger = document.querySelector('[role="combobox"]');
                              if (popoverTrigger instanceof HTMLElement) {
                                popoverTrigger.click();
                              }
                            }}
                          >
                            Done
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When the maintenance will end
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The current status of this maintenance
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notify"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Notify Users</FormLabel>
                    <FormDescription>
                      Send notifications to subscribers about this maintenance
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Scheduling..." : "Schedule Maintenance"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AddMaintenanceForm;