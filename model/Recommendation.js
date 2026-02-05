import sequelize from "../helpers/dbConnection.js";
import {DataTypes} from "sequelize";
import User from "./User.js";


const Recommendation = sequelize.define(
    "Recommendation",
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
            allowNull: false
        },
        risk: {
            type: DataTypes.ENUM('low', 'medium', 'high'),
            allowNull: false,
            defaultValue: 'low'
        }
    },
    {
        timestamps: true,
        paranoid: true,
        tableName: "recommendation"
    }
);

export default Recommendation;
