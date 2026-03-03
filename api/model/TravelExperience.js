import sequelize from "../helpers/dbConnection.js";
import {DataTypes} from "sequelize";
import User from "./User.js";

const TravelExperience = sequelize.define(
    "TravelExperience",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references:{
                model: User,
                key: 'id'
            }
        },
        age: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        income: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 20000
        },
        riskTolerance: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'low'
        },
        fitnessLevel: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'moderately_active'
        },
        interests: {
            type: DataTypes.JSON,//to handle string array saving
            allowNull: true,
            defaultValue: []
        },
        languages: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: ['english']
        },
        tripDuration: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'one_week'
        },
        travelGroup: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'solo'
        },
        topMatches: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: null
        },
        allMatches: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: null
        },
        profileSummary: {
            type: DataTypes.TEXT,
            allowNull: true,
        }
    },
    {
        timestamps: true,
        paranoid: true,
        tableName: "travel_experience"
    }
);

export default TravelExperience;
