'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Commentaire extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Commentaire.belongsTo(models.User,{foreignKey:{name:'idUser', allowNull:false}})
      Commentaire.belongsTo(models.Profil,{foreignKey:{name:'idProfil',allowNull:false}})
      Commentaire.belongsTo(models.Publication,{foreignKey:{name:'idPublication', allowNull:false}})
    }
  }
  Commentaire.init({
    message: DataTypes.STRING,
    idUser: DataTypes.INTEGER,
    idProfil: DataTypes.INTEGER,
    idPublication: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Commentaire',
  });
  return Commentaire;
};