'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X, ChevronDown, Grid3X3, List, Loader2 } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ProductCard, ProductCardSkeleton } from '@/components/product-card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Badge } from '@/shared/ui/badge'
import { Label } from '@/shared/ui/label'
import { Slider } from '@/shared/ui/slider'
import { Checkbox } from '@/shared/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/sheet'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/ui/collapsible'
import { listingsApi } from '@/lib/api'
import { categoryLabels, conditionLabels, departmentLabels, statusLabels } from '@/lib/types'
import type { Category, Condition, Department, Product, ProductStatus } from '@/lib/types'

const sortOptions = [
  { value: 'newest', label: 'Moi nhat' },
  { value: 'oldest', label: 'Cu nhat' },
  { value: 'price-asc', label: 'Gia thap den cao' },
  { value: 'price-desc', label: 'Gia cao den thap' },
  { value: 'popular', label: 'Pho bien nhat' },
] as const

function MarketplaceContent() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') as Category | null

  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<(typeof sortOptions)[number]['value']>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [priceRange, setPriceRange] = useState([0, 10_000_000])
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(
    initialCategory ? [initialCategory] : [],
  )
  const [selectedConditions, setSelectedConditions] = useState<Condition[]>([])
  const [selectedDepartments, setSelectedDepartments] = useState<Department[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<ProductStatus[]>(['selling'])
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const formatPrice = (price: number) => {
    if (price >= 1_000_000) {
      return `${(price / 1_000_000).toFixed(1)}tr`
    }
    return `${(price / 1_000).toFixed(0)}k`
  }

  const toggleArrayItem = <T,>(array: T[], item: T): T[] =>
    array.includes(item) ? array.filter((i) => i !== item) : [...array, item]

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
        setError(err instanceof Error ? err.message : 'Khong tai du lieu duoc')
        setProducts([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [
    searchQuery,
    selectedCategories,
    selectedConditions,
    selectedDepartments,
    selectedStatuses,
    priceRange,
    sortBy,
  ])

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

  const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Collapsible defaultOpen className="border-b border-border pb-4">
      <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-primary">
        {title}
        <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">{children}</CollapsibleContent>
    </Collapsible>
  )

  const FiltersContent = () => (
    <div className="space-y-4">
      <FilterSection title="Khoang gia">
        <div className="space-y-4 px-1">
          <Slider value={priceRange} onValueChange={setPriceRange} max={10_000_000} step={100_000} className="mt-2" />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatPrice(priceRange[0])}</span>
            <span>{formatPrice(priceRange[1])}</span>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Danh muc">
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

      <FilterSection title="Tinh trang">
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

      <FilterSection title="Khoa / Nganh">
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

      <FilterSection title="Trang thai">
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

      {activeFilterCount > 0 && (
        <Button variant="outline" className="w-full" onClick={clearAllFilters}>
          <X className="mr-2 h-4 w-4" />
          Xoa tat ca bo loc
        </Button>
      )}
    </div>
  )

  const renderContent = useMemo(() => {
    if (loading) {
      return (
        <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'flex flex-col gap-4'}>
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <p className="mb-3 text-sm text-destructive">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Thu lai
          </Button>
        </div>
      )
    }

    if (!products.length) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <Search className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">Khong tim thay san pham</h3>
          <p className="mb-4 text-center text-muted-foreground">Thu dieu chinh bo loc hoac tu khoa tim kiem.</p>
          <Button variant="outline" onClick={clearAllFilters}>
            Xoa bo loc
          </Button>
        </div>
      )
    }

    return (
      <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'flex flex-col gap-4'}>
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} variant={viewMode === 'list' ? 'horizontal' : 'default'} priority={index < 4} />
        ))}
      </div>
    )
  }, [loading, error, products, viewMode])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tim kiem san pham..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2 lg:hidden">
                    <SlidersHorizontal className="h-4 w-4" />
                    Bo loc
                    {activeFilterCount > 0 && (
                      <Badge className="ml-1 h-5 w-5 rounded-full p-0 text-xs">{activeFilterCount}</Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Bo loc</SheetTitle>
                    <SheetDescription>Loc san pham theo tieu chi cua ban</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <FiltersContent />
                  </div>
                </SheetContent>
              </Sheet>

              <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                <SelectTrigger className="w-[180px]">
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

              <div className="hidden items-center rounded-lg border border-input p-1 md:flex">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex gap-6">
            <aside className="hidden w-64 flex-shrink-0 lg:block">
              <div className="sticky top-20 rounded-lg border border-border bg-card p-4">
                <h2 className="mb-4 font-semibold">Bo loc</h2>
                <FiltersContent />
              </div>
            </aside>

            <div className="flex-1">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Tim thay <span className="font-medium text-foreground">{loading ? '...' : total}</span> san pham
                </p>
                {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              {renderContent}
            </div>
          </div>
        </div>
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
