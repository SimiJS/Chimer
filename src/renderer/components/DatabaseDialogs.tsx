import { Edit, Plus, Save, Trash2 } from 'lucide-react'
import { Button } from './ui/button'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from './ui/dialog'
import { Separator } from './ui/separator'
import { DeleteDialog } from './Dialogs'
import { AlertDialog, AlertDialogTrigger } from './ui/alert-dialog'
import { useSettings, useSound } from '@/hooks/useStores'
import { useState } from 'react'
import { toast } from 'sonner'
import { DatabaseService } from '@/services/databaseService'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Settings } from '@/types'

export function DatabaseList() {
	const { settings, updateSettings } = useSettings()

	const soundDatabases = settings.soundDatabases || []

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Sound Databases</DialogTitle>
			</DialogHeader>
			<Separator />
			<div className="flex flex-col gap-2">
				{soundDatabases.map((db) => (
					<div key={db.path} className="flex gap-2 w-full">
						<div className="flex-1 flex items-center justify-center border rounded-md p-2 text-sm font-medium">
							{db.name || db.path.split('/').pop() || 'Unnamed Database'}
						</div>
						<Dialog>
							<DialogTrigger asChild>
								<Button variant="outline" size="icon">
									<Edit />
								</Button>
							</DialogTrigger>
							<EditSoundDb
								soundDb={db}
								onSubmit={(editedDb) => {
									updateSettings({
										soundDatabases: soundDatabases.map((database) =>
											database.path === editedDb.path ? editedDb : database
										)
									})
								}}
							/>
						</Dialog>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button variant="destructive" size="icon">
									<Trash2 />
								</Button>
							</AlertDialogTrigger>
							<DeleteDialog
								title="Delete Sound Database"
								message="Are you sure you want to delete this sound database? This action cannot be undone."
								onAccept={() => {
									updateSettings({
										soundDatabases: soundDatabases.filter(
											(database) => database.path !== db.path
										)
									})
								}}
							/>
						</AlertDialog>
					</div>
				))}
			</div>
			<Separator />
			<Dialog>
				<DialogTrigger asChild>
					<Button variant="outline">
						<Plus />
						Add Database
					</Button>
				</DialogTrigger>
				<CreateDatabase />
			</Dialog>
		</DialogContent>
	)
}

export function CreateDatabase() {
	const { settings } = useSettings()
	const { sounds, groups } = useSound()
	const [databaseName, setDatabaseName] = useState<string>('')
	const [isCreating, setIsCreating] = useState(false)

	const handleCreateNew = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!databaseName.trim()) {
			toast.error('Database name is required')
			return
		}

		const trimmedName = databaseName.trim()
		const soundDatabases = settings.soundDatabases || []

		// Check for duplicate names
		if (soundDatabases.some((db) => db.name === trimmedName)) {
			toast.error('Database name already exists')
			return
		}

		setIsCreating(true)

		try {
			const success = await DatabaseService.createDatabase(
				trimmedName,
				sounds || [],
				groups || []
			)
			if (success) {
				setDatabaseName('')
			}
		} catch (error) {
			console.error('Database creation failed:', error)
			toast.error('Failed to create database')
		} finally {
			setIsCreating(false)
		}
	}

	const handleImportExisting = async () => {
		try {
			await DatabaseService.importDatabase()
		} catch (error) {
			console.error('Import failed:', error)
			toast.error('Failed to import database')
		}
	}

	const isFormValid = databaseName.trim().length > 0

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Manage Databases</DialogTitle>
			</DialogHeader>

			<div className="flex flex-col gap-4">
				<div className="space-y-3">
					<Label className="font-medium">Create New Database</Label>
					<form className="flex flex-col gap-3" onSubmit={handleCreateNew}>
						<Input
							type="text"
							placeholder="Database Name"
							value={databaseName}
							onChange={(e) => setDatabaseName(e.target.value)}
							disabled={isCreating}
						/>
						<Button
							type="submit"
							disabled={!isFormValid || isCreating}
							className="w-full"
						>
							{isCreating ? 'Creating...' : 'Create New Database'}
						</Button>
					</form>
				</div>

				<Separator />

				<div className="space-y-3">
					<Label className="font-medium">Import Existing</Label>
					<Button variant="outline" onClick={handleImportExisting} className="w-full">
						Import Database File
					</Button>
				</div>
			</div>
		</DialogContent>
	)
}

export function EditSoundDb({
	soundDb,
	onSubmit
}: {
	soundDb: Settings['soundDatabases'][number]
	onSubmit: (db: Settings['soundDatabases'][number]) => void
}) {
	const [editedDb, setEditedDb] = useState<Settings['soundDatabases'][number]>(soundDb)
	const submit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!editedDb.path.trim()) {
			toast.error('Database path cannot be empty.')
			return
		}
		onSubmit(editedDb)
	}
	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Edit Sound Database</DialogTitle>
			</DialogHeader>
			<form className="flex flex-col gap-4">
				<span className="inline flex-row items-center justify-center gap-2">
					<Input
						type="text"
						value={editedDb.path}
						onChange={(e) => setEditedDb({ ...editedDb, path: e.target.value })}
						placeholder="Database Path"
					/>
					<Button
						type="button"
						onClick={async () => {
							const result = await window.api.openDialog({
								filters: [{ name: 'Sound Database', extensions: ['sdb'] }]
							})
							if (result.success) {
								setEditedDb({ ...editedDb, path: result.data })
							} else {
								toast.error(result.message)
							}
						}}
					/>
				</span>
				<Button type="submit" onClick={submit} disabled={!editedDb.path.trim()}>
					<Save />
					Save Changes
				</Button>
			</form>
			<DialogClose asChild>
				<Button variant="outline">Cancel</Button>
			</DialogClose>
		</DialogContent>
	)
}
