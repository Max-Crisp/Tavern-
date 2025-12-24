// tavern-backend/src/server.ts
import "dotenv/config";
import app from "./app";
import { connectDB } from "./config/db.config";
import cors from 'cors';
import paymentRoutes from './routes/paymentRoutes';



const PORT = Number(process.env.PORT) || 3000;

// Verify JWT_SECRET is set
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL ERROR: JWT_SECRET is not set in .env file');
  console.error('Please create a .env file with JWT_SECRET variable');
  process.exit(1);
}

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Tavern backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};
app.use('/api/payments', paymentRoutes);

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

start();
