export default function ThemeController({ theme, toggleTheme }) {
  return (
    <>
      <label className="btn btn-ghost btn-circle swap swap-rotate cursor-pointer">
        {/* checkbox controls state */}
        <input
          type="checkbox"
          className="theme-controller"
          checked={theme === "dark"}
          onChange={toggleTheme}
        />

        {/* Sun icon */}
        <svg
          className="swap-off h-6 w-6 fill-current"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path d="M5.64 17.66L4.22 19.07 2.81 17.66 4.22 16.24 5.64 17.66ZM1 13h3v-2H1v2Zm10-9h2V1h-2v3Zm7.78 2.24l1.41-1.41-1.41-1.41-1.42 1.41 1.42 1.41ZM17 11v2h3v-2h-3ZM12 6a6 6 0 100 12 6 6 0 000-12Zm6.36 11.66l1.41 1.41 1.42-1.41-1.42-1.42-1.41 1.42ZM11 23h2v-3h-2v3ZM4.22 7.76 2.81 6.34 4.22 4.93 5.64 6.34 4.22 7.76Z" />
        </svg>

        {/* Moon icon */}
        <svg
          className="swap-on h-6 w-6 fill-current"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path d="M21.64 13a9 9 0 01-10.63-10.63 1 1 0 00-1.17-1.21A10 10 0 1022.85 14.2a1 1 0 00-1.21-1.2z" />
        </svg>
      </label>
    </>
  );
}
