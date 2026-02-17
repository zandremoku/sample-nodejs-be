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
            type: DataTypes.ENUM('basso', 'medio', 'alto', 'altissimo'),
            allowNull: false,
            defaultValue: 'medio'
        },
        riskTolerance: {
            type: DataTypes.ENUM('basso', 'medio', 'alto'),
            allowNull: false,
            defaultValue: 'basso'
        },
        fitnessLevel: {
            type: DataTypes.ENUM('sedentario', 'moderato', 'attivo', 'atletico'),
            allowNull: false,
            defaultValue: 'moderato'
        },
        interests: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: []
        },
        languages: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: ['italiano']
        },
        tripDuration: {
            type: DataTypes.ENUM('weekend', 'settimana', 'due_settimane', 'mese_o_piu'),
            allowNull: false,
            defaultValue: 'settimana'
        },
        travelGroup: {
            type: DataTypes.ENUM('solo', 'coppia', 'amici', 'famiglia_bambini', 'famiglia_adulti'),
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
