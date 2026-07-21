import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface TemplatePopularityProps {
  data: { id: string; name: string; usage: number; percentage: number }[]
}

export function TemplatePopularity({ data }: TemplatePopularityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>인기 템플릿 TOP 5</CardTitle>
        <CardDescription>가장 많이 사용된 템플릿 순위</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {data.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">아직 제작된 청첩장이 없습니다.</p>
        ) : (
          data.map((tpl, index) => (
            <div key={tpl.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <span className="flex size-5 items-center justify-center rounded-full bg-accent/20 text-xs text-accent-foreground">
                    {index + 1}
                  </span>
                  {tpl.name}
                </span>
                <span className="text-muted-foreground">{tpl.usage.toLocaleString("ko-KR")}건</span>
              </div>
              <Progress value={tpl.percentage} className="h-2" />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
