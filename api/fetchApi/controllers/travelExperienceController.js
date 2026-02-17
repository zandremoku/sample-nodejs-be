//@ts-check
import TravelExperience from "../../model/TravelExperience.js";
import User from "../../model/User.js";
import { evaluateProfile } from "../utils/travelRuleEngine.js";

const throwSystemError = (res, error) =>{
    console.error(error);
    res.status(500).json({
        message: 'Something went wrong!'
    });
}

const getTravelExperiences = async (req, res, next) =>{
    try{
        const userId = req.userId;
        const experiences = await TravelExperience.findAll({
            where: {
                userId
            }
        });

        res.status(200).json({
            data: experiences
        });
    }
    catch (e){
        throwSystemError(res, e);
    }
}

const getTravelExperience = async (req, res) =>{
    try{
        const userId = req.userId;
        const {id} = req.params;

        const experience = await TravelExperience.findOne({
            where: {
                id,
                userId
            }
        });

        if (!experience) {
            return res.status(404).json({
                message: 'Travel experience not found'
            });
        }

        res.status(200).json({
            data: experience
        });
    }
    catch (e){
        throwSystemError(res, e);
    }
}

const createTravelExperience = async (req, res) =>{
    try{
        const userId = req.userId;
        const { age, income, riskTolerance, fitnessLevel, interests, languages, tripDuration, travelGroup } = req.body;

        // Validate required fields
        if (!age || !income || !riskTolerance || !fitnessLevel || !interests || !tripDuration || !travelGroup) {
            return res.status(400).json({
                message: 'Missing required fields: age, income, riskTolerance, fitnessLevel, interests, tripDuration, travelGroup'
            });
        }

        // Prepare the traveler profile
        const profile = {
            age: parseInt(age),
            income,
            riskTolerance,
            fitnessLevel,
            interests: Array.isArray(interests) ? interests : [interests],
            languages: Array.isArray(languages) ? languages : (languages ? [languages] : ['italiano']),
            tripDuration,
            travelGroup
        };

        // Evaluate profile using rule engine
        const result = evaluateProfile(profile);

        // Create the travel experience record
        const experience = await TravelExperience.create({
            userId,
            age,
            income,
            riskTolerance,
            fitnessLevel,
            interests: profile.interests,
            languages: profile.languages,
            tripDuration,
            travelGroup,
            topMatches: result.topMatches,
            allMatches: result.allMatches,
            profileSummary: result.profileSummary
        });

        res.status(201).json({
            data: experience,
            message: 'Travel experience created successfully'
        });
    }
    catch (e){
        throwSystemError(res, e);
    }
}

const updateTravelExperience = async (req, res) =>{
    try{
        const userId = req.userId;
        const {id} = req.params;
        const updates = req.body;

        const experience = await TravelExperience.findOne({
            where: {
                id,
                userId
            }
        });

        if (!experience) {
            return res.status(404).json({
                message: 'Travel experience not found'
            });
        }

        // If profile data has changed, re-evaluate
        if (Object.keys(updates).some(key => ['age', 'income', 'riskTolerance', 'fitnessLevel', 'interests', 'languages', 'tripDuration', 'travelGroup'].includes(key))) {
            const profile = {
                age: updates.age || experience.age,
                income: updates.income || experience.income,
                riskTolerance: updates.riskTolerance || experience.riskTolerance,
                fitnessLevel: updates.fitnessLevel || experience.fitnessLevel,
                interests: Array.isArray(updates.interests) ? updates.interests : (updates.interests ? [updates.interests] : experience.interests),
                languages: Array.isArray(updates.languages) ? updates.languages : (updates.languages ? [updates.languages] : experience.languages),
                tripDuration: updates.tripDuration || experience.tripDuration,
                travelGroup: updates.travelGroup || experience.travelGroup
            };

            const result = evaluateProfile(profile);
            updates.topMatches = result.topMatches;
            updates.allMatches = result.allMatches;
            updates.profileSummary = result.profileSummary;
        }

        await experience.update(updates);
        await experience.save();
        await experience.reload();

        res.status(200).json({
            data: experience,
            message: 'Travel experience updated successfully'
        });
    }
    catch (e){
        throwSystemError(res, e);
    }
}

const deleteTravelExperience = async (req, res) =>{
    try{
        const userId = req.userId;
        const {id} = req.params;

        const experience = await TravelExperience.findOne({
            where: {
                id,
                userId
            }
        });

        if (!experience) {
            return res.status(404).json({
                message: 'Travel experience not found'
            });
        }

        await experience.destroy();

        res.status(200).json({
            message: 'Travel experience deleted successfully'
        });
    }
    catch (e){
        throwSystemError(res, e);
    }
}

export { getTravelExperiences, getTravelExperience, createTravelExperience, updateTravelExperience, deleteTravelExperience };
