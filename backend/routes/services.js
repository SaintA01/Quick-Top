import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  buyAirtime,
  buyData,
  buyCable,
  buyElectricity
} from '../controllers/servicesController.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/airtime', buyAirtime);
router.post('/data', buyData);
router.post('/cable', buyCable);
router.post('/electricity', buyElectricity);

export default router;
