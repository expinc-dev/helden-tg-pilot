import authBackground from './images/backgrounds/auth.png'
import centralLobbyBackground from './images/backgrounds/centralLobby.png'
import playerLobbyBackground from './images/backgrounds/playerLobby.png'
import rotateBackground from './images/backgrounds/rotate.png'
import eldercareCompanionship from './images/games/microlearning/eldercareCompanionship.png'
import eldercareVideoCall from './images/games/microlearning/eldercareVideoCall.png'
import eldercareWalkEvent from './images/games/microlearning/eldercareWalkEvent.png'
import industrialSafetyTeam from './images/games/microlearning/industrialSafetyTeam.png'
import trophyIcon from './images/icons/trophy.png'
import levelCardPhoto from './images/levelSelect/levelCard.png'
import levelDoneBadge from './images/levelSelect/levelDone.svg'
import levelProgressTip from './images/levelSelect/progressTip.svg'
import levelTrophy from './images/levelSelect/trophy.svg'
import heldenLogoSm from './images/logos/heldenLogoSm.png'
import classroomExample from './images/presentation/classroomExample.png'
import classroomExampleFramed from './images/presentation/classroomExampleFramed.png'
import instructionPhoto from './images/presentation/instruction.png'
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
    // Host "Pilih Level" screen (Figma Level Selection). The photo is a
    // placeholder shared by every card until phases carry their own thumbnail.
    levelSelect: {
      cardPhoto: levelCardPhoto,
      doneBadge: levelDoneBadge,
      progressTip: levelProgressTip,
      trophy: levelTrophy,
    },
    logos: {
      helden: {
        sm: heldenLogoSm,
      },
    },
    presentation: {
      classroomExample,
      classroomExampleFramed,
      instructionPhoto,
    },
  },
  lotties: {
    heldenLogo: HeldenLogoLotties,
    pleaseRotate: PleaseRotateLotties,
  },
}
