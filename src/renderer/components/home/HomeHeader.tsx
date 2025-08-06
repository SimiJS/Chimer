// Verified
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
	SelectSeparator
} from '@/components/ui/select'
import { useSound } from '@/hooks/useStores'

interface HomeHeaderProps {
	selectedGroup: string
	onGroupChange: (group: string) => void
	searchQuery: string
	onSearchChange: (query: string) => void
}

export function HomeHeader({
	selectedGroup,
	onGroupChange,
	searchQuery,
	onSearchChange
}: HomeHeaderProps) {
	const { groups } = useSound()

	return (
		<span className="inline-flex flex-row gap-2">
			<Select value={selectedGroup} onValueChange={onGroupChange}>
				<SelectTrigger className="w-35">
					<SelectValue placeholder="Select group" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="All">All</SelectItem>
					<SelectItem value="Ungrouped">Ungrouped</SelectItem>
					{groups.length > 0 && <SelectSeparator className="bg-neutral-700" />}
					{groups.map((group) => (
						<SelectItem key={group.id} value={group.id}>
							{group.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<span className="relative flex-1">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

				<Input
					placeholder="Search..."
					className="pl-9"
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
				/>
			</span>
		</span>
	)
}
