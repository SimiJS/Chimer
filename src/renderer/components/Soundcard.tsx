import { Card, CardFooter, CardTitle } from './ui/card'
import '@/assets/styles/components/soundcard.css'
import { memo, useEffect, useState } from 'react'

interface SoundcardProps {
	name: string
	imageSrc?: string
	onClick?: () => void
	isPlaying?: boolean
	className?: string
	hotkey?: string
}

export const Soundcard = memo(function Soundcard({
	name,
	imageSrc,
	onClick,
	isPlaying = false,
	className = '',
	hotkey = ''
}: SoundcardProps) {
	const [isHovered, setIsHovered] = useState(false)
	const [imageUrl, setImageUrl] = useState<string | null>(null)

	useEffect(() => {
		if (imageSrc && !imageSrc.startsWith('http')) {
			window.api.readData(imageSrc).then((result) => {
				if (result.success) {
					setImageUrl(URL.createObjectURL(new Blob([result.data])))
				} else {
					console.error(`Failed to load image: ${result.message}`)
				}
			})
		} else {
			setImageUrl(imageSrc || null)
		}
		return () => {
			if (imageUrl) {
				URL.revokeObjectURL(imageUrl)
			}
		}
	}, [imageSrc])

	const cardStyle = imageUrl
		? {
				backgroundImage: `url(${imageUrl})`,
				backgroundSize: 'cover',
				backgroundPosition: 'center',
				backgroundRepeat: 'no-repeat',
				animation: 'none'
			}
		: {}

	return (
		<div
			className="relative"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<Card
				className={`soundCard ${className} ${isPlaying ? 'playing' : ''}`}
				onClick={onClick}
				style={cardStyle}
			>
				<CardFooter className="section gap-2 !mt-auto !justify-center">
					<CardTitle>{name}</CardTitle>
				</CardFooter>
			</Card>
			{hotkey && (
				<div
					className={`absolute top-2 left-2 bg-black/80 text-white px-2 py-1 rounded-md text-xs transition-all duration-200 ${
						isHovered
							? 'opacity-100 translate-y-0'
							: 'opacity-0 -translate-y-1 pointer-events-none'
					}`}
				>
					{hotkey}
				</div>
			)}
		</div>
	)
})
