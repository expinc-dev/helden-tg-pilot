import authBackground from './images/backgrounds/auth.png'
import centralLobbyBackground from './images/backgrounds/centralLobby.png'
import playerLobbyBackground from './images/backgrounds/playerLobby.png'
import rotateBackground from './images/backgrounds/rotate.png'
import heldenLogoSm from './images/logos/heldenLogoSm.png'
import classroomExample from './images/presentation/classroomExample.png'
import classroomExampleFramed from './images/presentation/classroomExampleFramed.png'
// Lotties
import HeldenLogoLotties from './lotties/HeldenLogoLotties.json'
import PleaseRotateLotties from './lotties/PleaseRotate.json'

export const assets = {
  images: {
    backgrounds: {
      auth: authBackground,
      central: centralLobbyBackground,
      player: playerLobbyBackground,
      rotate: rotateBackground,
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
