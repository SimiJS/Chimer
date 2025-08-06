import { Trash2 } from 'lucide-react'
import {
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle
} from './ui/alert-dialog'

interface DeleteDialogProps {
	title: string
	message: string
	onAccept: () => void
}

export function DeleteDialog({ title, message, onAccept }: DeleteDialogProps) {
	return (
		<AlertDialogContent>
			<AlertDialogHeader>
				<AlertDialogTitle>{title}</AlertDialogTitle>
				<AlertDialogDescription>{message}</AlertDialogDescription>
			</AlertDialogHeader>
			<AlertDialogFooter>
				<AlertDialogCancel>Cancel</AlertDialogCancel>
				<AlertDialogAction onClick={onAccept}>
					<Trash2 />
					Delete
				</AlertDialogAction>
			</AlertDialogFooter>
		</AlertDialogContent>
	)
}
