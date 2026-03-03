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
            type: DataTypes.ENUM('low', 'medium', 'high'),
            allowNull: false,
            defaultValue: 'low'
        },
        fitnessLevel: {
            type: DataTypes.ENUM('sedentary', 'moderately_active', 'vigorously_active', 'extremely_active'),
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
            type: DataTypes.ENUM('weekend', 'one_week', 'two_weeks', 'three_weeks_plus'),
            allowNull: false,
            defaultValue: 'one_week'
        },
        travelGroup: {
            type: DataTypes.ENUM('solo', 'couple', 'friends', 'family_children', 'family_adults_only'),
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
