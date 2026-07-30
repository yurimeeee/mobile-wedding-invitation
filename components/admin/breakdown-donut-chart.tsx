"use client"

import { Pie, PieChart, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"

interface BreakdownDonutChartProps {
  title: string
  description: string
  data: { label: string; value: number; fill: string }[]
}

export function BreakdownDonutChart({ title, description, data }: BreakdownDonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const chartConfig = Object.fromEntries(
    data.map((d) => [d.label, { label: d.label, color: d.fill }])
  ) satisfies ChartConfig

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">아직 제작된 청첩장이 없습니다.</p>
        ) : (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[180px] w-[180px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={data} dataKey="value" nameKey="label" innerRadius={45} outerRadius={80} strokeWidth={2}>
                  {data.map((d) => (
                    <Cell key={d.label} fill={d.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="flex flex-1 flex-col gap-2">
              {data.map((d) => (
                <div key={d.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                    {d.label}
                  </span>
                  <span className="text-muted-foreground">
                    {d.value.toLocaleString("ko-KR")}건 ({total > 0 ? Math.round((d.value / total) * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
