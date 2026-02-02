/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from "react";
import { Calendar, Search, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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
import { getMealsByDateRange } from "@/actions/server/Meals";
import { GetMealsByDateRangeResponse } from "@/types/MealManagementTypes";

interface Props {
  onData: (data: GetMealsByDateRangeResponse) => void;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export default function MealDateRangePicker({ onData }: Props) {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 6);

  const [dateRange, setDateRange] = useState<DateRange>({
    from: sevenDaysAgo,
    to: today,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    if (!dateRange.from || !dateRange.to) {
      setError("Please select both start and end dates");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Format dates to YYYY-MM-DD
      const from = dateRange.from.toISOString().split("T")[0];
      const to = dateRange.to.toISOString().split("T")[0];

      // Simulated API call - replace with your actual function
      const res = await getMealsByDateRange({ from, to });

      if (!res.success) {
        setError(res.message || "Failed to load data");
        return;
      }

      onData(res);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleFetch();
  }, []);

  const formatDateRange = () => {
    if (!dateRange.from) return "Select dates";
    if (!dateRange.to) return `${formatDate(dateRange.from)} - Select end date`;
    return `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isValidRange = dateRange.from && dateRange.to;

  return (
    <Card className=" bg-background p-4 md:p-6 lg:p-2 max-w-7xl mx-auto">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">
          Select Date Range
        </CardTitle>
        <CardDescription className="text-sm">
          Choose a date range to view your meal history
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`w-full justify-start text-left font-normal h-auto py-3 px-4 ${
                !isValidRange && "text-muted-foreground"
              }`}
            >
              <Calendar className="mr-2 h-4 w-4  shrink-0" />
              <span className="truncate">{formatDateRange()}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
            <div className="p-3 space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">Start Date</p>
                <CalendarComponent
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) =>
                    setDateRange((prev) => ({ ...prev, from: date }))
                  }
                  disabled={(date) =>
                    date > new Date() ||
                    (dateRange.to ? date > dateRange.to : false)
                  }
                  initialFocus
                />
              </div>

              {dateRange.from && (
                <div className="space-y-2 border-t pt-3">
                  <p className="text-sm font-medium">End Date</p>
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) =>
                      setDateRange((prev) => ({ ...prev, to: date }))
                    }
                    disabled={(date) =>
                      date > new Date() ||
                      (dateRange.from ? date < dateRange.from : false)
                    }
                    initialFocus
                  />
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {error && (
          <Alert
            variant="destructive"
            className="animate-in fade-in slide-in-from-top-1"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleFetch}
          disabled={loading || !isValidRange}
          className="w-full h-11 font-semibold text-base shadow-md transition-all hover:shadow-lg disabled:shadow-none"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading meals...
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Get Meals
            </>
          )}
        </Button>

        {isValidRange && !error && !loading && (
          <p className="text-xs text-muted-foreground text-center animate-in fade-in slide-in-from-bottom-1">
            Ready to fetch meals from{" "}
            <span className="font-medium text-foreground">
              {formatDate(dateRange.from!)}
            </span>{" "}
            to{" "}
            <span className="font-medium text-foreground">
              {formatDate(dateRange.to!)}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
