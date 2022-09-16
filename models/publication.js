'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Publication extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Publication.belongsTo(models.User, {foreignKey:{name:'idUser', allowNull:false}})
      Publication.belongsTo(models.Profil,{foreignKey:{name:'idProfil', allowNull:false}})
      Publication.hasMany(models.Commentaire)
      Publication.hasMany(models.Like)
    }
  }
  Publication.init({
    message: DataTypes.STRING,
    imageURL: DataTypes.STRING,
    nbLike: DataTypes.INTEGER,
    nbDislike: DataTypes.INTEGER,
    nbCommentaire: DataTypes.INTEGER,
    idUser: DataTypes.INTEGER,
    idProfil: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Publication',
  });
  return Publication;
};