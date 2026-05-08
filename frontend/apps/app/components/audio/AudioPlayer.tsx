import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio"
import MView from "../reusables/MView"
import { Button } from "../reusables/Button"
import { useEffect, useState } from "react"
import { PauseCircle, Play } from "@/lib/icons"

export default function AudioPlayer({ uri }: { uri: string }) {
  const player = useAudioPlayer(uri)
  const playerStatus = useAudioPlayerStatus(player)

  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)

  function startPlayback() {
    setPlaying(true)
    if (paused) {
      setPaused(false)
    } else {
      player.seekTo(0)
    }
    player.play()
  }
  function pausePlayback() {
    setPlaying(false)
    setPaused(true)
    player.pause()
  }

  useEffect(() => {
    if (playing && !playerStatus.playing) {
      setPlaying(false)
      setPaused(false)
    }
  }, [playerStatus.playing])

  if (!uri) {
    return null
  }

  return (
    <MView className="flex flex-row gap-4 justify-center">
      <Button size="iconLg" onPress={playing ? pausePlayback : startPlayback}>
        {(!playing || paused) && <Play size={24} className="text-background" />}
        {playing && <PauseCircle size={24} className="text-background" />}
      </Button>
    </MView>
  )
}
