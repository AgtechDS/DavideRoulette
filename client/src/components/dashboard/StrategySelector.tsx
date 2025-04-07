import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Strategy, BotStatus } from "@/lib/types";

interface StrategySelectorProps {
  onStartBot: (strategy: Strategy) => void;
  currentStrategy: Strategy | null;
  botStatus: BotStatus;
}

// Strategy validation schema
const strategySchema = z.object({
  type: z.enum(["martingala", "fibonacci", "dalembert", "custom"]),
  initialBet: z.coerce.number().min(1, "Initial bet must be at least 1"),
  maxLosses: z.coerce.number().min(1, "Max losses must be at least 1"),
  betType: z.enum(["color", "evenOdd"]), 
  targetProfit: z.coerce.number().min(1, "Target profit must be at least 1"),
  stopLoss: z.coerce.number().min(1, "Stop loss must be at least 1"),
  sessionDuration: z.coerce.number().min(5, "Session duration must be at least 5 minutes"),
});

export default function StrategySelector({ onStartBot, currentStrategy, botStatus }: StrategySelectorProps) {
  const { toast } = useToast();
  
  // Form setup with default values
  const form = useForm<z.infer<typeof strategySchema>>({
    resolver: zodResolver(strategySchema),
    defaultValues: currentStrategy || {
      type: "martingala",
      initialBet: 5,
      maxLosses: 6,
      betType: "color",
      targetProfit: 100,
      stopLoss: 50,
      sessionDuration: 60,
    }
  });

  // Save strategy mutation
  const saveStrategyMutation = useMutation({
    mutationFn: async (strategy: Strategy) => {
      const res = await apiRequest('POST', '/api/strategy', strategy);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Strategy Saved",
        description: "Your betting strategy has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/strategy/current'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Save Strategy",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: z.infer<typeof strategySchema>) => {
    saveStrategyMutation.mutate(data as Strategy);
  };

  const handleStartBot = () => {
    const values = form.getValues();
    onStartBot(values as Strategy);
  };

  return (
    <Card className="border border-border mb-6">
      <CardHeader className="p-4 border-b border-border">
        <h2 className="font-medium">Strategy Configuration</h2>
      </CardHeader>
      
      <CardContent className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Strategy Type Selector */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-muted-foreground">Strategy Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={botStatus.active}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select strategy" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="martingala">Martingala</SelectItem>
                      <SelectItem value="fibonacci">Fibonacci</SelectItem>
                      <SelectItem value="dalembert">D'Alembert</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            {/* Initial Bet Amount */}
            <FormField
              control={form.control}
              name="initialBet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-muted-foreground">Initial Bet Amount (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      disabled={botStatus.active}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* Max Consecutive Losses */}
            <FormField
              control={form.control}
              name="maxLosses"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-muted-foreground">Max Consecutive Losses</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      disabled={botStatus.active}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* Bet Type */}
            <FormField
              control={form.control}
              name="betType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-muted-foreground">Bet Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="grid grid-cols-2 gap-2"
                      disabled={botStatus.active}
                    >
                      <div className="flex items-center space-x-2 bg-card p-2 rounded-md border border-border">
                        <RadioGroupItem value="color" id="color" />
                        <label htmlFor="color" className="text-sm cursor-pointer">Color (Red/Black)</label>
                      </div>
                      <div className="flex items-center space-x-2 bg-card p-2 rounded-md border border-border">
                        <RadioGroupItem value="evenOdd" id="evenOdd" />
                        <label htmlFor="evenOdd" className="text-sm cursor-pointer">Even/Odd</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* Target Profit */}
            <FormField
              control={form.control}
              name="targetProfit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-muted-foreground">Target Profit (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      disabled={botStatus.active}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* Stop Loss */}
            <FormField
              control={form.control}
              name="stopLoss"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-muted-foreground">Stop Loss (€)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      disabled={botStatus.active}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* Session Duration */}
            <FormField
              control={form.control}
              name="sessionDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm text-muted-foreground">Session Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={5}
                      {...field}
                      disabled={botStatus.active}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            {/* Action Buttons */}
            <div className="flex space-x-2 mt-6">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={saveStrategyMutation.isPending || botStatus.active}
              >
                Save Strategy
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleStartBot}
                disabled={saveStrategyMutation.isPending || botStatus.active}
                className="bg-success hover:bg-success/80 text-white"
              >
                Start Bot
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
