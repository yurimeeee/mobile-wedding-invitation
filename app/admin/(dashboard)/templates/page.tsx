"use client"

import { useEffect, useState } from "react"
import { AdminHeader } from "@/components/admin/admin-header"
import { TemplateCard } from "@/components/admin/template-card"
import { fetchAdminTemplates, setTemplateDisabled, type AdminTemplateItem } from "@/lib/admin-data-client"
import { toast } from "sonner"

export default function TemplateManagementPage() {
  const [items, setItems] = useState<AdminTemplateItem[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdminTemplates()
      .then(({ templates }) => setItems(templates))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleToggleDisabled = async (template: AdminTemplateItem, disabled: boolean) => {
    try {
      await setTemplateDisabled(template.id, disabled)
      setItems((prev) => prev.map((t) => (t.id === template.id ? { ...t, disabled } : t)))
      toast.success(disabled ? "템플릿을 비활성화했습니다." : "템플릿을 활성화했습니다.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "처리 중 오류가 발생했습니다.")
    }
  }

  return (
    <>
      <AdminHeader breadcrumb="템플릿 관리" />
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">템플릿 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            제공 중인 청첩장 템플릿의 실사용 현황을 확인하고, 편집기에서 선택 가능 여부를 관리합니다.
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {items.map((tpl) => (
            <TemplateCard key={tpl.id} template={tpl} onToggleDisabled={handleToggleDisabled} />
          ))}
        </div>
      </main>
    </>
  )
}
