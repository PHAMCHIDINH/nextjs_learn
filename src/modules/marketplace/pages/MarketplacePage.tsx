'use client'

import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  ChevronDown,
  Filter,
  Grid3X3,
  List,
  Loader2,
  Search,
  SlidersHorizontal,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { ProductCard, ProductCardSkeleton } from '@/components/product-card'
import { listingsApi } from '@/lib/api'
import type { Category, Condition, Department, Product, ProductStatus } from '@/lib/types'
import { categoryLabels, conditionLabels, departmentLabels, statusLabels } from '@/lib/types'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Checkbox } from '@/shared/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/sheet'
import { Slider } from '@/shared/ui/slider'

const sortOptions = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'price-asc', label: 'Giá thấp đến cao' },
  { value: 'price-desc', label: 'Giá cao đến thấp' },
  { value: 'popular', label: 'Phổ biến nhất' },
] as const

function MarketplaceContent() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') as Category | null

  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]['value']>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [priceRange, setPriceRange] = useState([0, 10_000_000])
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(initialCategory ? [initialCategory] : [])
  const [selectedConditions, setSelectedConditions] = useState<Condition[]>([])
  const [selectedDepartments, setSelectedDepartments] = useState<Department[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<ProductStatus[]>(['selling'])
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const formatPriceCompact = (price: number) => {
    if (price >= 1_000_000) {
      return `${(price / 1_000_000).toFixed(1)}tr`
    }

    return `${(price / 1_000).toFixed(0)}k`
  }

  const toggleArrayItem = <T,>(array: T[], item: T): T[] =>
    array.includes(item) ? array.filter((value) => value !== item) : [...array, item]

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await listingsApi.list({
          page: 1,
          limit: 60,
          search: searchQuery || undefined,
          category: selectedCategories[0],
          condition: selectedConditions[0],
          department: selectedDepartments[0],
          status: selectedStatuses.length === 1 ? selectedStatuses[0] : undefined,
          minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
          maxPrice: priceRange[1] < 10_000_000 ? priceRange[1] : undefined,
          sortBy,
        })

        setProducts(response.data)
        setTotal(response.meta.total)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không tải dữ liệu được')
        setProducts([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [priceRange, searchQuery, selectedCategories, selectedConditions, selectedDepartments, selectedStatuses, sortBy])

  const activeFilterCount =
    selectedCategories.length +
    selectedConditions.length +
    selectedDepartments.length +
    (selectedStatuses.length !== 1 || selectedStatuses[0] !== 'selling' ? selectedStatuses.length : 0) +
    (priceRange[0] > 0 || priceRange[1] < 10_000_000 ? 1 : 0)

  const clearAllFilters = () => {
    setSelectedCategories([])
    setSelectedConditions([])
    setSelectedDepartments([])
    setSelectedStatuses(['selling'])
    setPriceRange([0, 10_000_000])
    setSearchQuery('')
  }

  const quickStats = useMemo(() => {
    const uniqueDepartments = new Set(products.map((product) => product.department)).size
    const averagePrice = products.length
      ? Math.round(products.reduce((sum, product) => sum + product.price, 0) / products.length)
      : 0

    return [
      { label: 'kết quả đang hiển thị', value: loading ? '...' : `${total}` },
      { label: 'khoa có tin đăng', value: loading ? '...' : `${uniqueDepartments}` },
      { label: 'giá trung bình', value: loading || !averagePrice ? '...' : formatPriceCompact(averagePrice) },
    ]
  }, [loading, products, total])

  const activeFilterPills = useMemo(
    () => [
      ...selectedCategories.map((value) => ({
        key: `category-${value}`,
        label: categoryLabels[value],
        onRemove: () => setSelectedCategories((prev) => prev.filter((item) => item !== value)),
      })),
      ...selectedConditions.map((value) => ({
        key: `condition-${value}`,
        label: conditionLabels[value],
        onRemove: () => setSelectedConditions((prev) => prev.filter((item) => item !== value)),
      })),
      ...selectedDepartments.map((value) => ({
        key: `department-${value}`,
        label: departmentLabels[value],
        onRemove: () => setSelectedDepartments((prev) => prev.filter((item) => item !== value)),
      })),
      ...selectedStatuses
        .filter((value) => selectedStatuses.length !== 1 || value !== 'selling')
        .map((value) => ({
          key: `status-${value}`,
          label: statusLabels[value],
          onRemove: () => setSelectedStatuses((prev) => prev.filter((item) => item !== value)),
        })),
      ...(priceRange[0] > 0 || priceRange[1] < 10_000_000
        ? [
            {
              key: 'price-range',
              label: `${formatPriceCompact(priceRange[0])} - ${formatPriceCompact(priceRange[1])}`,
              onRemove: () => setPriceRange([0, 10_000_000]),
            },
          ]
        : []),
    ],
    [priceRange, selectedCategories, selectedConditions, selectedDepartments, selectedStatuses],
  )

  const FilterSection = ({ title, children }: { title: string; children: ReactNode }) => (
    <Collapsible defaultOpen className="border-b border-border/70 pb-4">
      <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-primary">
        {title}
        <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">{children}</CollapsibleContent>
    </Collapsible>
  )

  const FiltersContent = () => (
    <div className="space-y-4">
      <FilterSection title="Khoảng giá">
        <div className="space-y-4 px-1">
          <Slider value={priceRange} onValueChange={setPriceRange} max={10_000_000} step={100_000} className="mt-2" />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatPriceCompact(priceRange[0])}</span>
            <span>{formatPriceCompact(priceRange[1])}</span>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Danh mục">
        <div className="space-y-2">
          {Object.entries(categoryLabels).map(([key, label]) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${key}`}
                checked={selectedCategories.includes(key as Category)}
                onCheckedChange={() => setSelectedCategories(toggleArrayItem(selectedCategories, key as Category))}
              />
              <Label htmlFor={`cat-${key}`} className="cursor-pointer text-sm font-normal">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Tình trạng">
        <div className="space-y-2">
          {Object.entries(conditionLabels).map(([key, label]) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={`cond-${key}`}
                checked={selectedConditions.includes(key as Condition)}
                onCheckedChange={() => setSelectedConditions(toggleArrayItem(selectedConditions, key as Condition))}
              />
              <Label htmlFor={`cond-${key}`} className="cursor-pointer text-sm font-normal">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Khoa / ngành">
        <div className="space-y-2">
          {Object.entries(departmentLabels).map(([key, label]) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={`dept-${key}`}
                checked={selectedDepartments.includes(key as Department)}
                onCheckedChange={() => setSelectedDepartments(toggleArrayItem(selectedDepartments, key as Department))}
              />
              <Label htmlFor={`dept-${key}`} className="cursor-pointer text-sm font-normal">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Trạng thái">
        <div className="space-y-2">
          {Object.entries(statusLabels).map(([key, label]) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${key}`}
                checked={selectedStatuses.includes(key as ProductStatus)}
                onCheckedChange={() => setSelectedStatuses(toggleArrayItem(selectedStatuses, key as ProductStatus))}
              />
              <Label htmlFor={`status-${key}`} className="cursor-pointer text-sm font-normal">
                {label}
              </Label>
            </div>
          ))}
        </div>
      </FilterSection>

      {activeFilterCount > 0 ? (
        <Button variant="outline" className="w-full rounded-full" onClick={clearAllFilters}>
          <X className="mr-2 h-4 w-4" />
          Xóa tất cả bộ lọc
        </Button>
      ) : null}
    </div>
  )

  const renderContent = useMemo(() => {
    if (loading) {
      return (
        <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col gap-4'}>
          {Array.from({ length: 9 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      )
    }

    if (error) {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="mb-3 text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Thử lại
            </Button>
          </CardContent>
        </Card>
      )
    }

    if (!products.length) {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">Không tìm thấy sản phẩm</h3>
            <p className="mb-4 max-w-md text-muted-foreground">Thử đổi từ khóa hoặc giảm bớt bộ lọc để mở rộng kết quả.</p>
            <Button variant="outline" onClick={clearAllFilters}>
              Xóa bộ lọc
            </Button>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'flex flex-col gap-4'}>
        {products.map((product, index) => (
          <ProductCard
            key={product.id}
            product={product}
            variant={viewMode === 'list' ? 'horizontal' : 'default'}
            priority={index < 3}
          />
        ))}
      </div>
    )
  }, [error, loading, products, viewMode])

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_rgba(250,250,249,1)_0%,_rgba(244,244,245,1)_100%)]">
      <Header />

      <main className="pb-12">
        <section className="border-b border-border/60 bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.16),_transparent_24%),radial-gradient(circle_at_top_left,_rgba(245,158,11,0.12),_transparent_22%)]">
          <div className="container mx-auto px-4 py-10 md:py-14">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div className="max-w-3xl">
                <Badge className="rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-primary hover:bg-primary/10">
                  Marketplace nội bộ
                </Badge>
                <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight md:text-6xl">
                  Tìm đúng món đồ sinh viên đang cần mua và bán trong học kỳ này.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
                  Tìm kiếm theo danh mục, giá, khoa và tình trạng. Mỗi kết quả được trình bày để quét nhanh hơn và
                  ra quyết định nhanh hơn.
                </p>
              </div>

              <Card className="overflow-hidden border-border/60 bg-zinc-950 text-white shadow-2xl shadow-zinc-950/10">
                <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
                  {quickStats.map((stat) => (
                    <div key={stat.label}>
                      <p className="text-2xl font-semibold">{stat.value}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-zinc-400">{stat.label}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="mt-8 border-border/60 bg-white/85 shadow-lg shadow-zinc-950/5 backdrop-blur">
              <CardContent className="space-y-5 p-5 md:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Tìm laptop, giáo trình, bàn học, quạt mini..."
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="h-12 rounded-full border-border/70 bg-background pl-11 pr-10"
                    />
                    {searchQuery ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full"
                        onClick={() => setSearchQuery('')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                      <SheetTrigger asChild>
                        <Button variant="outline" className="h-11 rounded-full px-4 lg:hidden">
                          <SlidersHorizontal className="mr-2 h-4 w-4" />
                          Bộ lọc
                          {activeFilterCount > 0 ? (
                            <Badge className="ml-2 h-5 min-w-5 rounded-full px-1.5 text-[10px]">{activeFilterCount}</Badge>
                          ) : null}
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-80 overflow-y-auto">
                        <SheetHeader>
                          <SheetTitle>Bộ lọc</SheetTitle>
                          <SheetDescription>Lọc sản phẩm theo tiêu chí cần mua ngay lúc này.</SheetDescription>
                        </SheetHeader>
                        <div className="mt-6">
                          <FiltersContent />
                        </div>
                      </SheetContent>
                    </Sheet>

                    <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                      <SelectTrigger className="h-11 w-[190px] rounded-full bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="hidden items-center rounded-full border border-input bg-background p-1 md:flex">
                      <Button
                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-9 w-9 rounded-full"
                        onClick={() => setViewMode('grid')}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-9 w-9 rounded-full"
                        onClick={() => setViewMode('list')}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {Object.entries(categoryLabels).map(([key, label]) => {
                    const active = selectedCategories.includes(key as Category)

                    return (
                      <Button
                        key={key}
                        variant={active ? 'default' : 'outline'}
                        size="sm"
                        className="rounded-full"
                        onClick={() => setSelectedCategories(toggleArrayItem(selectedCategories, key as Category))}
                      >
                        {label}
                      </Button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="container mx-auto px-4 pt-8">
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                <Card className="overflow-hidden border-border/60 shadow-sm">
                  <CardHeader className="border-b bg-zinc-950 text-white">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Filter className="h-4 w-4" />
                      Bộ lọc thông minh
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <FiltersContent />
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-white/80 shadow-sm">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">Mẹo lọc nhanh</p>
                        <p className="text-xs text-muted-foreground">Bắt đầu từ danh mục và giá, sau đó mới lọc khoa.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">Sort theo mới nhất</p>
                        <p className="text-xs text-muted-foreground">Phù hợp khi cần món đồ gấp trong tuần này.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </aside>

            <div className="space-y-5">
              <div className="rounded-[1.75rem] border border-border/60 bg-white/80 p-5 shadow-sm backdrop-blur">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Đang hiển thị <span className="font-medium text-foreground">{loading ? '...' : total}</span> sản phẩm
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-3 py-1.5">
                        <Store className="h-3.5 w-3.5" />
                        ưu tiên người bán cùng trường
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-3 py-1.5">
                        <Users className="h-3.5 w-3.5" />
                        dễ hẹn gặp tại campus
                      </span>
                    </div>
                  </div>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
                </div>

                {activeFilterPills.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {activeFilterPills.map((pill) => (
                      <button
                        key={pill.key}
                        onClick={pill.onRemove}
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary"
                      >
                        <span>{pill.label}</span>
                        <X className="h-3 w-3" />
                      </button>
                    ))}
                    <Button variant="ghost" size="sm" className="rounded-full text-xs" onClick={clearAllFilters}>
                      Xóa tất cả
                    </Button>
                  </div>
                ) : null}
              </div>

              {renderContent}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default function MarketplacePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <MarketplaceContent />
    </Suspense>
  )
}
