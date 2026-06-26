import { Composition } from 'remotion'
import { CacaoPitch } from './CacaoPitch'
import { CatacionPromo } from './CatacionPromo'
import { CatacionReel } from './CatacionReel'
import { CatacionThumbnail } from './CatacionThumbnail'
import { AdoptarReel } from './AdoptarReel'
import { AdoptarThumbnail } from './AdoptarThumbnail'

export const RemotionRoot = () => (
  <>
    <Composition
      id="AdoptarThumbnail"
      component={AdoptarThumbnail}
      durationInFrames={1}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{}}
    />
    <Composition
      id="AdoptarReel"
      component={AdoptarReel}
      durationInFrames={2530}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{}}
    />
    <Composition
      id="CatacionThumbnail"
      component={CatacionThumbnail}
      durationInFrames={1}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{}}
    />
    <Composition
      id="CacaoPitch"
      component={CacaoPitch}
      durationInFrames={420}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{}}
    />
    <Composition
      id="CatacionPromo"
      component={CatacionPromo}
      durationInFrames={840}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{}}
    />
    <Composition
      id="CatacionReel"
      component={CatacionReel}
      durationInFrames={1179}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{}}
    />
  </>
)
