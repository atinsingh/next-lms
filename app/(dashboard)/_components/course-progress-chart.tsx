'use client';

import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type CourseProgressData = {
  name: string;
  progress: number;
}[];

interface CourseProgressChartProps {
  courses: {
    id: string;
    title: string;
    progress: number | null;
  }[];
}

export const CourseProgressChart = ({ courses }: CourseProgressChartProps) => {
  // Filter out courses without progress and format data for the chart
  const chartData: CourseProgressData = courses
    .filter(course => course.progress !== null)
    .map(course => ({
      name: course.title.length > 15 ? `${course.title.substring(0, 15)}...` : course.title,
      progress: course.progress || 0,
      fullName: course.title
    }));

  if (chartData.length === 0) {
    return null; // Don't render the chart if there's no progress data
  }

  return (
    <Card className="p-6 mt-8">
      <h3 className="text-lg font-semibold mb-4">Course Progress Overview</h3>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end"
              height={60}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              domain={[0, 100]} 
              tickFormatter={(value) => `${value}%`}
              width={40}
            />
            <Tooltip 
              formatter={(value: number) => [`${value}%`, 'Progress']}
              labelFormatter={(label, payload) => {
                const fullName = payload[0]?.payload?.fullName;
                return fullName || label;
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="progress"
              name="Progress"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
