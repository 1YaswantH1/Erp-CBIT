// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

// const attendanceRoute = require("./routes/attendance");
const placementsRoute = require("./routes/placements");
const papersRoute = require("./routes/papers");
const attendanceRoute = require("./routes/attendence");
const syllabusRoutes = require("./routes/syllabus");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/", attendanceRoute);
app.use("/api/syllabus", syllabusRoutes);
app.use("/papers", papersRoute);
app.use("/placements", placementsRoute);

// app.use("/attendance", attendanceRoute);

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});