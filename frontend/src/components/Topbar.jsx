import { Moon, Sun, Menu } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import SearchBar from './SearchBar'
import NotificationsDropdown from './NotificationsDropdown'

export default function Topbar({ onMenuClick }) {
  const { theme, setTheme } = useTheme()

  return (
    <header className="flex h-16 items-center gap-4 border-b border-border bg-bg-soft px-4">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-text-muted hover:bg-card hover:text-text-soft lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <SearchBar />

      <div className="flex items-center gap-2">
        <NotificationsDropdown />

        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="rounded-lg p-2 text-text-muted hover:bg-card hover:text-text-soft"
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
      </div>
    </header>
  )
}