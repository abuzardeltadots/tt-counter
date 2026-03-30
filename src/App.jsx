import AppProvider, { useApp } from './context/AppContext'
import SetupScreen from './components/SetupScreen'
import GameScreen from './components/GameScreen'
import TeamsScreen from './components/TeamsScreen'
import TournamentScreen from './components/TournamentScreen'
import WinScreen from './components/WinScreen'
import HistoryScreen from './components/HistoryScreen'
import Modals from './components/Modals'
import SpectatorOverlay from './components/SpectatorOverlay'

function AppContent() {
  const { confettiRef } = useApp();

  return (
    <>
      <SetupScreen />
      <TeamsScreen />
      <TournamentScreen />
      <GameScreen />
      <WinScreen />
      <HistoryScreen />
      <Modals />
      <SpectatorOverlay />
      <canvas ref={confettiRef} className="confetti-canvas"/>
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
