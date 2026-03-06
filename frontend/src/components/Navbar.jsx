import { useEffect, useState } from "react";
import ThemeController from "./ThemeController";

function Navbar() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light",
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <div className="navbar bg-base-100 px-10 border-b">
      {/* Logo */}
      <div className="navbar-start">
        <a className="text-2xl font-bold">ERP-CBIT</a>
      </div>

      {/* Menu */}
      <div className="navbar-center lg:flex">
        <ul className="menu menu-horizontal gap-4 font-medium">
          {/* Attendance Analyzer (Hidden initially) */}
          <li>
            <a>Attendance Analyzer</a>
          </li>
          <li>
            <a>Holidays</a>
          </li>

          {/* Clubs Dropdown */}
          <li>
            <details>
              <summary>Clubs</summary>
              <ul className="p-2 bg-base-100 rounded-box w-48">
                <li>
                  <a>Clubs</a>
                </li>
                <li>
                  <a>Club Recruitment</a>
                </li>
              </ul>
            </details>
          </li>

          {/* Support Dropdown */}
          <li>
            <a>Support</a>
          </li>
          <li>
            <a>About</a>
          </li>
        </ul>
      </div>

      {/* Right Section */}
      <div className="navbar-end gap-3">
        {/* Theme Toggle */}
        <ThemeController theme={theme} toggleTheme={toggleTheme} />
      </div>
    </div>
  );
}

export default Navbar;
