import { Label } from '@/components/ui/label'
import {
	Select,
	SelectTrigger,
	SelectContent,
	SelectItem,
	SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Upload, Download, Trash2 } from 'lucide-react'
import { useSettings } from '@/hooks/useStores'
import { useDatabaseOperations } from '../../hooks/useDatabaseOperations'
import { DatabaseList } from '../DatabaseDialogs'
import { toast } from 'sonner'
import { DEFAULT_SOUNDBANK } from '@/constants'

export function DatabaseSettings() {
	const { settings } = useSettings()
	const { importDatabase, exportDatabase, switchDatabase, clearDefault } = useDatabaseOperations()

	const exportDatabaseFunction = async () => {
		const path = await exportDatabase()
		if (!path) {
			toast.error('Failed to export database')
			return
		}
		if (!settings.soundDatabases.some((db) => db.path === path)) {
			importDatabase(path)
		}
	}

	return (
		<div className="flex flex-col gap-2">
			<Label className="font-bold text-xl">Sound Databases</Label>
			<div className="flex flex-col gap-3">
				<div className="flex items-center gap-2">
					<Dialog>
						<DialogTrigger asChild>
							<Button variant="outline" size="icon" title="Manage Databases">
								<Plus />
							</Button>
						</DialogTrigger>
						<DatabaseList />
					</Dialog>
					<Button
						variant="outline"
						size="icon"
						onClick={() => importDatabase()}
						title="Import Database"
					>
						<Download />
					</Button>
					<Button
						variant="outline"
						size="icon"
						onClick={exportDatabaseFunction}
						title="Export Current Database"
					>
						<Upload />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={clearDefault}
						title="Clear Default"
					>
						<Trash2 />
					</Button>
				</div>

				<Select
					value={settings.currentDatabase || DEFAULT_SOUNDBANK.id}
					onValueChange={switchDatabase}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select Database" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={DEFAULT_SOUNDBANK.id}>Default</SelectItem>

						{(settings.soundDatabases || []).length === 0 ? (
							<SelectItem value="empty" disabled>
								No Databases Available
							</SelectItem>
						) : (
							(settings.soundDatabases || []).map((db) => (
								<SelectItem key={db.path} value={db.path}>
									{db.name}
								</SelectItem>
							))
						)}
					</SelectContent>
				</Select>
			</div>
		</div>
	)
}
