import express from 'express';
import isAuth from "../../middleware/isAuth.js";
import {
    createRecommendation, deleteRecommendation,
    getRecommendation,
    getRecommendations,
    updateRecommendation
} from "../controllers/recommendationController.js";

const router = express.Router();

router.get('/recommendations', isAuth, getRecommendations);
router.get('/recommendation/:id', isAuth, getRecommendation);
router.post('/recommendation', isAuth, createRecommendation);
router.put('/recommendation/:id', isAuth, updateRecommendation);
router.patch('/recommendation/:id', isAuth, updateRecommendation);
router.delete('/recommendation/:id', isAuth, deleteRecommendation);

export default router;
