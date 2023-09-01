const db = require("../models");
const contract = db.contract_infos;

async function saveContractInfo(name, version, address, abi) {
  try {
    // Save the contract information in the database
    const result = await contract.create({
      name: name,
      version: version,
      address: address,
      abi: JSON.stringify(abi),
    });

    console.log("Contract saved successfully.");

    return result;
  } catch (err) {
    console.error("Failed to save contract:", err);
  }
}

module.exports = {
  saveContractInfo,
};
