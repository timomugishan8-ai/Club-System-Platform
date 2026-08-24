export default function Spinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
    </div>
  )
}