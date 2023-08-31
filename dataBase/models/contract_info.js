module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "contract_infos",
    {
      name: { type: DataTypes.STRING, allowNull: false },
      version: { type: DataTypes.STRING, allowNull: false },
      address: { type: DataTypes.STRING, allowNull: false },
      abi: { type: DataTypes.JSON, allowNull: false },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    {}
  );
};
