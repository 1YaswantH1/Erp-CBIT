import { useState } from "react";
import axios from "axios";
import "../css/Syllabus.css";

const Syllabus = () => {
  const [, setType] = useState("");
  const [data, setData] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL;

  const fetchSyllabus = async (value) => {
    try {
      setType(value);

      const res = await axios.get(`${API_URL}/api/syllabus/${value}`);

      if (Array.isArray(res.data)) {
        setData(res.data);
      } else {
        console.error("Unexpected API response:", res.data);
        setData([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setData([]);
    }
  };

  return (
    <div className="syllabus-page">
      <h2 className="syllabus-title">CBIT Syllabus</h2>

      <div className="dropdown-container">
        <select
          className="syllabus-dropdown"
          onChange={(e) => fetchSyllabus(e.target.value)}
        >
          <option value="">Select Type</option>
          <option value="ug">UG</option>
          <option value="pg">PG</option>
        </select>
      </div>

      {Array.isArray(data) && data.length > 0 && (
        <table className="syllabus-table">
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>
                    {cell.link ? (
                      <a href={cell.link} target="_blank" rel="noreferrer">
                        {cell.text}
                      </a>
                    ) : (
                      cell.text
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Syllabus;
