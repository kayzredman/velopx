import { PartsTable } from './PartsTable'

export default function PartsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#E8ECF1]">Parts Catalogue</h1>
      </div>
      <PartsTable />
    </div>
  )
}
