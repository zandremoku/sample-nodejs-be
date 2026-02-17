import express from 'express';
import isAuth from "../../middleware/isAuth.js";
import {
    createTravelExperience, deleteTravelExperience,
    getTravelExperience,
    getTravelExperiences,
    updateTravelExperience
} from "../controllers/travelExperienceController.js";

const router = express.Router();

router.get('/travel-experiences', isAuth, getTravelExperiences);
router.get('/travel-experience/:id', isAuth, getTravelExperience);
router.post('/travel-experience', isAuth, createTravelExperience);
router.put('/travel-experience/:id', isAuth, updateTravelExperience);
router.patch('/travel-experience/:id', isAuth, updateTravelExperience);
router.delete('/travel-experience/:id', isAuth, deleteTravelExperience);

export default router;
