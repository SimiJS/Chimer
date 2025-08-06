import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { Card, CardDescription, CardTitle } from '@/components/ui/card'
import { SearchResult } from 'youtube-search-api'
import { Download, Loader, Play, Square } from 'lucide-react'
import { useSound } from '@/hooks/useStores'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

export function Downloader() {
	const [searchTerm, setSearchTerm] = useState('')
	const [searchResults, setSearchResults] = useState<SearchResult>()

	const [previewingId, setPreviewingId] = useState<string | null>(null)
	const [downloadingId, setDownloadingId] = useState<string | null>(null)

	const { previewYoutube, isPlaying, currentSound, addSound } = useSound()

	const handleSearch = async () => {
		if (!searchTerm.trim()) return
		const results = await window.api.searchYoutube(searchTerm)
		if (!results.success) {
			toast.error(results.message)
			return
		}
		setSearchResults(results.data)
	}

	return (
		<ScrollArea className="h-[calc(100vh-3rem)] w-full p-3 flex flex-col">
			<span className="flex flex-row gap-2 mb-5 w-full overflow-visible p-1">
				<Input
					placeholder="Search..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					onKeyDown={async (e) => {
						if (e.key === 'Enter') {
							await handleSearch()
						}
					}}
				/>
				<Button
					onClick={async () => {
						await handleSearch()
					}}
				>
					Search
				</Button>
			</span>
			{searchResults?.items.map((item) => (
				<Card
					key={item.id}
					className="p-2 mb-2 flex-row justify-between"
					style={{ display: 'flex', width: '100%', height: '120px' }}
				>
					<img
						className="rounded-md  h-full w-fit"
						// deepcode ignore DOMXSS: Sanitized by the library
						src={item.thumbnail.thumbnails[0].url}
					/>
					<div className="flex flex-col gap-2 p-2 text-end justify-between">
						<span className="flex-col gap-1">
							<CardTitle className="overflow-ellipsis">{item.title}</CardTitle>
							<CardDescription className="overflow-ellipsis">
								{item.channelTitle}
							</CardDescription>
						</span>

						<span className="flex flex-row gap-2 self-end">
							<Button
								size="icon"
								variant="outline"
								disabled={downloadingId === item.id}
								onClick={async () => {
									try {
										setDownloadingId(item.id)
										const path = await window.api.downloadYoutube(item.id)
										if (!path.success || !path.data) {
											toast.error(path.message || 'Download failed')
											setDownloadingId(null)
											return
										}
										// Only add the sound after the file is downloaded and path is valid
										addSound({
											id: crypto.randomUUID(),
											name: item.title,
											soundSrc: path.data,
											imageSrc: item.thumbnail.thumbnails[0].url
										})
										console.log('Sound added successfully:', item.title)
									} catch (error) {
										console.error('Download failed:', error)
									} finally {
										setDownloadingId(null)
									}
								}}
							>
								{downloadingId === item.id ? (
									<Loader className="h-4 w-4 animate-spin" />
								) : (
									<Download className="h-4 w-4" />
								)}
							</Button>
							<Button
								size="icon"
								variant="outline"
								onClick={async () => {
									setPreviewingId(item.id)
									await previewYoutube({
										id: item.id,
										name: item.title,
										soundSrc: item.id
									})
									setPreviewingId(null)
								}}
							>
								{isPlaying && currentSound?.id === item.id ? (
									<Square />
								) : previewingId === item.id ? (
									<Loader className="h-4 w-4 animate-spin" />
								) : (
									<Play className="h-4 w-4" />
								)}
							</Button>
						</span>
					</div>
				</Card>
			))}
			<ScrollBar />
		</ScrollArea>
	)
}
