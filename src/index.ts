import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import collegeRoutes from './routes/collegeRoutes';
import departmentRoutes from './routes/departmentRoutes';
import sectionRoutes from './routes/sectionRoutes';
import yearRoutes from './routes/yearRoute';
import { BASE_URL } from './constants';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(`${BASE_URL}/auth`, authRoutes);
app.use(`${BASE_URL}/college`, collegeRoutes);
app.use(`${BASE_URL}/department`, departmentRoutes);
app.use(`${BASE_URL}/section`, sectionRoutes);
app.use(`${BASE_URL}/year`, yearRoutes);


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
