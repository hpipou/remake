'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Like extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Like.belongsTo(models.User,{foreignKey:{name:'idUser', allowNull:false}})
      Like.belongsTo(models.Profil,{foreignKey:{name:'idProfil',allowNull:false}})
      Like.belongsTo(models.Publication,{foreignKey:{name:'idPublication', allowNull:false}})
    }
  }
  Like.init({
    type: DataTypes.STRING,
    idUser: DataTypes.INTEGER,
    idProfil: DataTypes.INTEGER,
    idPublication: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Like',
  });
  return Like;
};