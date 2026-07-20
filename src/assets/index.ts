import authBackground from './images/backgrounds/auth.png'
import centralLobbyBackground from './images/backgrounds/centralLobby.png'
import playerLobbyBackground from './images/backgrounds/playerLobby.png'
import rotateBackground from './images/backgrounds/rotate.png'
import eldercareCompanionship from './images/games/microlearning/eldercareCompanionship.png'
import eldercareVideoCall from './images/games/microlearning/eldercareVideoCall.png'
import eldercareWalkEvent from './images/games/microlearning/eldercareWalkEvent.png'
import industrialSafetyTeam from './images/games/microlearning/industrialSafetyTeam.png'
import trophyIcon from './images/icons/trophy.png'
import heldenLogoSm from './images/logos/heldenLogoSm.png'
import classroomExample from './images/presentation/classroomExample.png'
import classroomExampleFramed from './images/presentation/classroomExampleFramed.png'
// Lotties — imported as URLs so DotLottieReact can fetch/parse them itself.
import HeldenLogoLotties from './lotties/HeldenLogoLotties.json?url'
import PleaseRotateLotties from './lotties/PleaseRotate.json?url'

export const assets = {
  images: {
    backgrounds: {
      auth: authBackground,
      central: centralLobbyBackground,
      player: playerLobbyBackground,
      rotate: rotateBackground,
    },
    icons: {
      trophy: trophyIcon,
    },
    games: {
      microlearning: {
        eldercareCompanionship,
        eldercareVideoCall,
        eldercareWalkEvent,
        industrialSafetyTeam,
      },
    },
    logos: {
      helden: {
        sm: heldenLogoSm,
      },
    },
    presentation: {
      classroomExample,
      classroomExampleFramed,
    },
  },
  lotties: {
    heldenLogo: HeldenLogoLotties,
    pleaseRotate: PleaseRotateLotties,
  },
}
