type Props = { total: number; from: number; to: number }

export default function Summary({ total, from, to }: Props) {
  return (
    <div className="col-12 text-center text-sm-start col-sm-auto col-lg mb-3">
      Showing {from}–{to} of {total}
    </div>
  )
}
