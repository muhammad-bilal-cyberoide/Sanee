"use client"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"

interface Category {
  id: string
  name: string
}

interface SearchBarProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  activeMainFilter: string // Prop for main tabs (all, gigs, jobs)
  onMainFilterChange: (filter: string) => void // Handler for main tabs
  activeCategoryFilter: string // Prop for category selection
  onCategoryFilterChange: (categoryId: string) => void // Handler for category selection
  categories: Category[]
  authUserType?: string
  isRTL: boolean
  tabs: { id: string; label: string }[] // This prop is now used for the main filters
}

export default function SearchBar({
  searchTerm,
  onSearchChange,
  activeMainFilter,
  onMainFilterChange,
  activeCategoryFilter,
  onCategoryFilterChange,
  categories,
  authUserType,
  isRTL,
  tabs, // Using the 'tabs' prop for the main filters
}: SearchBarProps) {
  const { t } = useTranslation()

  // Determine main filters based on role (using the 'tabs' prop passed from Discover.tsx)
  const mainFilters = tabs

  return (
    <div className={`w-full mx-auto mb-8 ${isRTL ? "text-right" : "text-left"}`}>
      {/* Search input */}
      <div className="relative mb-6">
        <Search
          className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 ${
            isRTL ? "right-3" : "left-3"
          }`}
        />
        <Input
          type="text"
          placeholder={
            authUserType === "seller"
              ? t("search_jobs_services") || "Search jobs and services..."
              : t("search_services") || "Search services..."
          }
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSearchChange(searchTerm)
            }
          }}
          className={`py-3 text-lg border-red-200 focus:border-red-500 rounded-lg ${isRTL ? "pr-10" : "pl-10"}`}
        />
      </div>
      {/* Main filters (tabs) */}
      <div className="flex flex-wrap gap-2 mb-4">
        {mainFilters.map((f) => (
          <Button
            key={f.id}
            variant={activeMainFilter === f.id ? "default" : "outline"}
            onClick={() => onMainFilterChange(f.id)}
            className={`rounded-full px-4 py-2 text-sm ${
              activeMainFilter === f.id
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {f.label}
          </Button>
        ))}
      </div>
      {/* Category filters */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-600">{t("categories") || "Categories"}:</h3>
          <div className="flex flex-wrap gap-2">
            {/* "All Categories" button */}
            <Button
              key="all-categories"
              variant={activeCategoryFilter === "all" ? "default" : "outline"}
              onClick={() => onCategoryFilterChange("all")}
              className={`rounded-full px-4 py-2 text-sm ${
                activeCategoryFilter === "all"
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {t("all_categories") || "All Categories"}
            </Button>
            {/* Dynamic category buttons */}
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategoryFilter === cat.id ? "default" : "outline"}
                onClick={() => onCategoryFilterChange(cat.id)}
                className={`rounded-full px-4 py-2 text-sm ${
                  activeCategoryFilter === cat.id
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
