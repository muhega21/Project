import express from 'express';
import cors from 'cors';
import warehouseRoutes from './routes/warehouse.routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/warehouse', warehouseRoutes);

// General route
app.get('/', (req, res) => {
  res.send('MaintainX Backend API is running.');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
