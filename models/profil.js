'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Profil extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Profil.belongsTo(models.User,{foreignKey:{name:'idUser', allowNull:false}})
      Profil.hasMany(models.Publication)
      Profil.hasMany(models.Commentaire)
      Profil.hasMany(models.Like)
    }
  }
  Profil.init({
    fname: DataTypes.STRING,
    lname: DataTypes.STRING,
    age: DataTypes.INTEGER,
    workplace: DataTypes.STRING,
    city: DataTypes.STRING,
    country: DataTypes.STRING,
    imageURL: DataTypes.STRING,
    idUser: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Profil',
  });
  return Profil;
};