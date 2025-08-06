import { useCallback } from 'react'
import { toast } from 'sonner'

export interface AppError {
	message: string
	code?: string
	context?: string
}

export function useErrorHandler() {
	const handleError = useCallback((error: Error | AppError, context?: string) => {
		const errorMessage = error.message || 'An unexpected error occurred'
		const errorContext = 'context' in error ? error.context : context

		console.error(`Error in ${errorContext}:`, error)

		toast.error(errorMessage, {
			description: errorContext ? `Context: ${errorContext}` : undefined
		})
	}, [])

	const handleAsyncError = useCallback(
		<T extends (...args: any[]) => Promise<any>>(asyncFn: T, context: string) => {
			return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
				try {
					return await asyncFn(...args)
				} catch (error) {
					handleError(error as Error, context)
					throw error
				}
			}
		},
		[handleError]
	)

	return { handleError, handleAsyncError }
}
