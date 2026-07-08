import Paginate from '@/components/Pagination/Paginate'
import RowsPerPage from '@/components/Pagination/RowsPerPage'
import Summary from '@/components/Pagination/Summary'

type PaginationMeta = {
  from: number
  to: number
  total: number
  per_page: number
  last_page: number
  current_page: number
}

type Props = { meta: PaginationMeta }

export default function Pagination({ meta }: Props) {
  const {
    from, to, total, per_page: perPage, last_page: lastPage, current_page: currentPage,
  } = meta

  return (
    <div className="row align-items-center justify-content-center">
      <Summary from={from} to={to} total={total} />
      <RowsPerPage perPage={perPage} />
      <Paginate currentPage={currentPage} lastPage={lastPage} />
    </div>
  )
}
