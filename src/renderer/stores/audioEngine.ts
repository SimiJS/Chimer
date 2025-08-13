interface PlaybackSession {
	audioBuffer: AudioBuffer
	source: AudioBufferSourceNode | null
	startTime: number
	pausedAt: number
	isLooping: boolean
}

type EndedCallback = () => void

export class AudioEngine {
	readonly context = new AudioContext()
	private mainOutputGain = this.context.createGain()
	private auxOutputGain = this.context.createGain()
	private session: PlaybackSession | null = null
	private playbackRate = 1
	private auxEnabled = false
	private endedCallbacks: EndedCallback[] = []
	private currentPlayPromise: Promise<void> | null = null

	constructor() {
		this.mainOutputGain.connect(this.context.destination)
		this.auxOutputGain.connect(this.context.destination)
		this.mainOutputGain.gain.value = 1
		this.auxOutputGain.gain.value = 0
	}

	onEnded(cb: EndedCallback) {
		this.endedCallbacks.push(cb)
		return () => {
			this.endedCallbacks = this.endedCallbacks.filter((f) => f !== cb)
		}
	}

	private triggerEnded() {
		this.endedCallbacks.forEach((cb) => cb())
	}

	private createSource(): AudioBufferSourceNode {
		const source = this.context.createBufferSource()
		source.buffer = this.session!.audioBuffer
		source.loop = this.session!.isLooping
		source.playbackRate.value = this.playbackRate
		source.connect(this.mainOutputGain)
		source.connect(this.auxOutputGain)

		source.onended = () => {
			if (!source.loop && this.session?.source === source) {
				this.session.source = null
				this.triggerEnded()
			}
		}

		return source
	}

	async play(path: string, loop: boolean): Promise<void> {
		const playPromise = this._performPlay(path, loop)
		this.currentPlayPromise = playPromise

		try {
			await playPromise
		} finally {
			if (this.currentPlayPromise === playPromise) {
				this.currentPlayPromise = null
			}
		}
	}

	private async _performPlay(path: string, loop: boolean): Promise<void> {
		let arrayBuffer: ArrayBuffer
		if (path.startsWith('blob:')) {
			arrayBuffer = await fetch(path).then((r) => r.arrayBuffer())
		} else {
			const fileData = await window.api.readData(path)
			if (!fileData.success) throw new Error(fileData.message)
			arrayBuffer = new Uint8Array(fileData.data).buffer
		}

		const audioBuffer = await this.context.decodeAudioData(arrayBuffer)

		this.stop()

		this.session = {
			audioBuffer,
			source: null,
			startTime: this.context.currentTime,
			pausedAt: 0,
			isLooping: loop
		}

		const source = this.createSource()
		source.start()
		this.session.source = source
	}

	getCurrentPlayPromise(): Promise<void> | null {
		return this.currentPlayPromise
	}

	pause() {
		if (!this.session?.source) return

		const elapsed = this.context.currentTime - this.session.startTime
		this.session.pausedAt += elapsed * this.playbackRate
		this.session.source.stop()
		this.session.source = null
	}

	resume() {
		if (!this.session || this.session.source) return

		const source = this.createSource()
		const startTime = this.context.currentTime
		source.start(startTime, this.session.pausedAt)

		this.session.source = source
		this.session.startTime = startTime
	}

	stop() {
		if (this.session?.source) {
			this.session.source.stop()
		}
		this.session = null
	}

	setPlaybackRatePercent(percent: number) {
		const clamped = Math.max(50, Math.min(200, percent))
		this.playbackRate = clamped / 100

		if (this.session?.source) {
			this.session.source.playbackRate.value = this.playbackRate
		}
	}

	getPlaybackRatePercent() {
		return this.playbackRate * 100
	}

	setOutputVolumes(mainPercent: number, auxPercent?: number) {
		this.mainOutputGain.gain.value = Math.min(mainPercent / 100, 1)
		if (auxPercent) {
			this.auxOutputGain.gain.value = this.auxEnabled ? Math.min(auxPercent / 100, 1) : 0
		}
	}

	setAuxEnabled(enable: boolean) {
		this.auxEnabled = enable
		if (!enable) {
			this.auxOutputGain.gain.value = 0
		}
	}
	setOutputDeviceIds(_mainDeviceId: string, _auxDeviceId?: string) {}

	setLooping(loop: boolean) {
		if (this.session) {
			this.session.isLooping = loop
			if (this.session.source) {
				this.session.source.loop = loop
			}
		}
	}

	seek(seconds: number) {
		if (!this.session) return

		const duration = this.session.audioBuffer.duration
		const clampedSeconds = Math.max(0, Math.min(duration - 0.02, seconds))
		const wasPlaying = !!this.session.source

		if (wasPlaying) this.pause()
		this.session.pausedAt = clampedSeconds
		if (wasPlaying) this.resume()
	}

	rewind(seconds = 5) {
		this.seek(this.getCurrentTime() - seconds)
	}

	forward(seconds = 5) {
		this.seek(this.getCurrentTime() + seconds)
	}

	getCurrentTime() {
		if (!this.session) return 0

		return this.session.source
			? this.session.pausedAt +
					(this.context.currentTime - this.session.startTime) * this.playbackRate
			: this.session.pausedAt
	}

	getDuration() {
		return this.session?.audioBuffer.duration ?? 0
	}

	isPlaying() {
		return !!this.session?.source
	}

	isPaused() {
		return !!this.session && !this.session.source
	}

	isLooping() {
		return !!this.session?.isLooping
	}

	dispose() {
		this.stop()
		this.context.close().catch(() => {})
	}
}

export const audioEngine = new AudioEngine()
