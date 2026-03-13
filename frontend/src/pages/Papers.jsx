import { useEffect, useState } from "react";
import "../css/papers.css";

function Papers() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/papers`)
      .then((res) => res.json())
      .then((data) => {
        setPapers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="papers-loading">Loading papers...</div>;
  }

  return (
    <div className="papers-container">
      <h1 className="papers-heading">CBIT Question Papers</h1>

      <div className="papers-grid">
        {papers.map((paper, index) => (
          <a
            key={index}
            href={paper.link}
            target="_blank"
            rel="noreferrer"
            className="paper-card"
          >
            <div
              className="paper-image"
              style={{
                backgroundImage: `url(${paper.image})`,
              }}
            ></div>

            <div className="paper-title">{paper.title}</div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default Papers;
