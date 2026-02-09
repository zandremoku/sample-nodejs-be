//@ts-check
import Recommendation from "../../model/Recommendation.js";
import User from "../../model/User.js";

const throwSystemError = (res, error) =>{
    res.status(500).json({
        message: 'Something went wrong!'
    });
}

const recommend = (type, amount, duration) => {
    return {
        plan: `${type} - $${amount} for ${
            duration === "lifetime" ? "life" : duration + " years"
        }`,
        reason: `Based on your age, income and risk tolerance we recommend a ${type} plan.`,
    };
};

const getRecommendationHandler = ({ age, riskTolerance }) => {
    if (age < 40) {
        if (riskTolerance === "high") {
            return recommend("Term Life", 500_000, 20);
        }
        if (riskTolerance === "medium") {
            return recommend("Term Life", 300_000, 15);
        }

        return recommend("Whole Life", 250_000, "lifetime");
    }

    if (age >= 40 && age <= 60) {
        return recommend("Whole Life", 300_000, "lifetime");
    }

    return recommend("Final Expense", 100_000, "lifetime");
};


const getRecommendations = async (req, res, next) =>{
    try{
        const userId = req.userId;//very important. please see middleware/isAuth.js where this is set.
        const recommendations = await Recommendation.findAll({
            where: {
                userId
            }
        });

        console.log(recommendations);

        res.status(200).json({
            data: recommendations
        });
    }
    catch (e){
        throwSystemError(res, e);
    }
}

const getRecommendation = async (req, res) =>{
    try{
        const id = req.params.id;
        if(!id){
            return res.status(400).json({
                message: 'id is required'
            });
        }
        const recommendation = await Recommendation.findByPk(id);
        if(!recommendation){
            return res.status(404).json({
                message: 'recommendation not found'
            })
        }

        res.status(200).json({
            data: recommendation
        })
    }
    catch (e){
        throwSystemError(res, e);
    }
}

const createRecommendation =  async (req, res) =>{
    const {age, income, risk} = req.body;
    const userId = req.userId;//very important. please see middleware/isAuth.js where this is set.
    try {
        if(!age || !parseInt(age) || parseInt(age) < 0 || parseInt(age) > 100){
            return res.status(400).json({
                message: 'age is required'
            });
        }
        if(!income || !parseInt(income) || parseInt(income) < 0){
            return res.status(400).json({
                message: 'income is required'
            });
        }
        const riskList  = ['low', 'medium', 'high'];
        const riskLC = risk.toLowerCase().trim();
        if(!risk || !riskList.includes(riskLC)){
            return res.status(400).json({
                message: 'risk is required'
            });
        }

        console.log('userId', userId)
        const user = await User.findByPk(userId);
        if(!user){
            return res.status(401).json({
                message: 'Unauthorized!'
            });
        }

        const message = getRecommendationHandler({
            age,
            riskTolerance: risk,
        });
        const payload = {
            age, income, risk: riskLC, userId, result: message.plan
        };
        const recommendation = await Recommendation.create(payload);
        console.log(recommendation);

        res.status(200).json({
            data: {
                ...recommendation.dataValues,
                message: message.reason,
            }
        });

    }
    catch (e){
        throwSystemError(res, e);
    }
}

const updateRecommendation = async (req, res) =>{
    const {age, income, risk} = req.body;
    try {
        const id = req.params.id;
        if(!id){
            return res.status(400).json({
                message: 'id is required'
            });
        }
        if(!age || !parseInt(age) || !parseInt(age) < 0 || !parseInt(age) > 100){
            return res.status(400).json({
                message: 'age is required'
            });
        }
        if(!income || !parseInt(income) || parseInt(income) < 0){
            return res.status(400).json({
                message: 'income is required'
            });
        }

        const riskList  = ['low', 'medium', 'high'];
        const riskLC = risk.toLowerCase().trim();
        if(!risk || !riskList.includes(riskLC)){
            return res.status(400).json({
                message: 'risk is required'
            });
        }

        const userId = req.params.userId;
        const [user, recommendation] = await Promise.all([User.findByPk(userId),Recommendation.findByPk(id)]);
        if(!user){
            return res.status(401).json({
                message: 'Unauthorized!'
            });
        }
        if(!recommendation){
            return res.status(404).json({
                message: 'recommendation not found'
            })
        }

        const message = getRecommendationHandler({
            age,
            riskTolerance: riskLC,
        });

        const payload = {
            age, income, risk: riskLC, userId, result: message.plan
        };

        recommendation.update(payload);
        await recommendation.save();
        await recommendation.reload();

        res.status(200).json({
            data: recommendation
        });
    }
    catch (e){
        throwSystemError(res, e);
    }
}

const deleteRecommendation =  async (req, res) =>{
    try{
        const id = req.params.id;
        if(!id){
            return res.status(400).json({
                message: 'id is required'
            });
        }
        const recommendation = await Recommendation.findByPk(id);
        if(!recommendation){
            return res.status(404).json({
                message: 'recommendation not found'
            })
        }

        await recommendation.destroy();

        res.status(200).json({
            message: 'recommendation has been deleted successfully'
        })
    }
    catch (e){
        throwSystemError(res, e);
    }
}

export {
    getRecommendation,
    getRecommendations,
    createRecommendation,
    updateRecommendation,
    deleteRecommendation
};
