import { Composition } from 'remotion'
import { CacaoPitch } from './CacaoPitch'

export const RemotionRoot = () => (
  <Composition
    id="CacaoPitch"
    component={CacaoPitch}
    durationInFrames={420}  // 14s @ 30fps
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{}}
  />
)
