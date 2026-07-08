import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  useCreatePlant, 
  useUpdatePlant, 
  useGetPlant, 
  getListPlantsQueryKey, 
  getGetPlantQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, X } from "lucide-react";

const plantSchema = z.object({
  plantCode: z.string().min(1, "Plant code is required").transform((v) => v.trim()).refine((v) => v.length > 0, "Plant code is required"),
  botanicalName: z.string().min(1, "Botanical name is required").transform((v) => v.trim()).refine((v) => v.length > 0, "Botanical name is required"),
  commonName: z.string().min(1, "Common name is required").transform((v) => v.trim()).refine((v) => v.length > 0, "Common name is required"),
  category: z.string().min(1, "Category is required").transform((v) => v.trim()).refine((v) => v.length > 0, "Category is required"),
  plantType: z.string().min(1, "Plant type is required").transform((v) => v.trim()).refine((v) => v.length > 0, "Plant type is required"),
  potSize: z.string().min(1, "Pot size is required").transform((v) => v.trim()).refine((v) => v.length > 0, "Pot size is required"),
  imageUrl: z.string().nullable().optional(),
});

type PlantFormValues = z.infer<typeof plantSchema>;

interface PlantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plantId: number | null;
}

export function PlantDialog({ open, onOpenChange, plantId }: PlantDialogProps) {
  const isEdit = !!plantId;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: plant, isLoading: isLoadingPlant } = useGetPlant(plantId || 0, {
    query: {
      enabled: isEdit && open,
      queryKey: getGetPlantQueryKey(plantId || 0)
    }
  });

  const form = useForm<PlantFormValues>({
    resolver: zodResolver(plantSchema),
    defaultValues: {
      plantCode: "",
      botanicalName: "",
      commonName: "",
      category: "",
      plantType: "",
      potSize: "",
      imageUrl: null,
    },
  });

  useEffect(() => {
    if (open) {
      if (isEdit && plant) {
        form.reset({
          plantCode: plant.plantCode,
          botanicalName: plant.botanicalName,
          commonName: plant.commonName,
          category: plant.category,
          plantType: plant.plantType,
          potSize: plant.potSize,
          imageUrl: plant.imageUrl,
        });
      } else if (!isEdit) {
        form.reset({
          plantCode: "",
          botanicalName: "",
          commonName: "",
          category: "",
          plantType: "",
          potSize: "",
          imageUrl: null,
        });
      }
    }
  }, [open, isEdit, plant, form]);

  const createPlant = useCreatePlant({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPlantsQueryKey() });
        toast({ title: "Plant created", description: "The plant has been added to the catalog." });
        onOpenChange(false);
      },
      onError: (error: any) => {
        const message = error?.error === "Conflict" || error?.status === 409 
          ? "A plant with this code already exists." 
          : "Failed to create plant.";
        toast({ title: "Error", description: message, variant: "destructive" });
      }
    }
  });

  const updatePlant = useUpdatePlant({
    mutation: {
      onSuccess: (updatedPlant) => {
        queryClient.invalidateQueries({ queryKey: getListPlantsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPlantQueryKey(updatedPlant.id) });
        toast({ title: "Plant updated", description: "The plant details have been saved." });
        onOpenChange(false);
      },
      onError: (error: any) => {
         const message = error?.error === "Conflict" || error?.status === 409 
          ? "A plant with this code already exists." 
          : "Failed to update plant.";
        toast({ title: "Error", description: message, variant: "destructive" });
      }
    }
  });

  const onSubmit = (values: PlantFormValues) => {
    if (isEdit && plantId) {
      updatePlant.mutate({ id: plantId, data: values });
    } else {
      createPlant.mutate({ data: values });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue("imageUrl", reader.result as string, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    form.setValue("imageUrl", null, { shouldDirty: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isSubmitting = createPlant.isPending || updatePlant.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Plant" : "Add New Plant"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the details of the selected plant." : "Enter the details to add a new plant to the catalog."}
          </DialogDescription>
        </DialogHeader>

        {isEdit && isLoadingPlant ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
              
              <div className="flex justify-center mb-6">
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                  />
                  
                  {form.watch("imageUrl") ? (
                    <div className="relative h-24 w-24 rounded-full border-2 border-border overflow-hidden">
                      <img 
                        src={form.watch("imageUrl") as string} 
                        alt="Plant preview" 
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="text-white hover:text-white hover:bg-white/20"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <ImagePlus className="h-5 w-5" />
                        </Button>
                      </div>
                      <button
                        type="button"
                        className="absolute top-0 right-0 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-1/4 -translate-y-1/4"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeImage();
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-24 w-24 rounded-full border-2 border-dashed border-border bg-muted flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/80 hover:border-primary/50 transition-colors"
                    >
                      <ImagePlus className="h-6 w-6 mb-1" />
                      <span className="text-[10px] font-medium">Add Image</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="plantCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plant Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. ROS-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="potSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pot Size</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 140mm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="botanicalName"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Botanical Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Rosmarinus officinalis" className="italic" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="commonName"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Common Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Rosemary" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Herbs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="plantType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plant Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Shrub" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Plant"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}