import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { categoryService } from '@/services/category.service'
import type { Category } from '@/types'

export function useCategoryOptions() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.list(),
  })

  const byType = useMemo(() => {
    const grouped: Record<string, Category[]> = {}
    for (const category of data ?? []) {
      const list = grouped[category.category_type] ?? (grouped[category.category_type] = [])
      list.push(category)
    }
    for (const list of Object.values(grouped)) {
      list.sort((a, b) => a.weight - b.weight || a.id - b.id)
    }
    return grouped
  }, [data])

  return { byType, isLoading, isError }
}
