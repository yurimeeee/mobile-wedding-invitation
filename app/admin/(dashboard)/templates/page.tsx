"use client"

import { useState } from "react"
import { Plus, Search } from "lucide-react"
import { AdminHeader } from "@/components/admin/admin-header"
import { TemplateCard } from "@/components/admin/template-card"
import { TemplateBuilder } from "@/components/admin/template-builder"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { adminTemplates, templateCategories, type AdminTemplate } from "@/lib/admin-data"

export default function TemplateManagementPage() {
  const [category, setCategory] = useState<string>("전체")
  const [search, setSearch] = useState("")
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<AdminTemplate | null>(null)

  const filtered = adminTemplates.filter((tpl) => {
    const matchesCategory = category === "전체" || tpl.category === category
    const matchesSearch = tpl.name.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const openCreate = () => {
    setEditingTemplate(null)
    setBuilderOpen(true)
  }

  const openEdit = (template: AdminTemplate) => {
    setEditingTemplate(template)
    setBuilderOpen(true)
  }

  return (
    <>
      <AdminHeader breadcrumb="템플릿 관리" />
      <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight">템플릿 관리</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              청첩장 템플릿을 만들고 관리하세요.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="mr-1 size-4" />
            새 템플릿 만들기
          </Button>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={category} onValueChange={setCategory}>
            <TabsList>
              {templateCategories.map((c) => (
                <TabsTrigger key={c} value={c}>
                  {c}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative sm:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="템플릿 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {filtered.map((tpl) => (
              <TemplateCard key={tpl.id} template={tpl} onEdit={openEdit} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-20 text-center">
            <p className="font-medium">검색 결과가 없습니다</p>
            <p className="text-sm text-muted-foreground">
              다른 검색어나 카테고리를 선택해 보세요.
            </p>
          </div>
        )}
      </main>

      <TemplateBuilder open={builderOpen} onOpenChange={setBuilderOpen} template={editingTemplate} />
    </>
  )
}
