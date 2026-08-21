// parkingCOntroller.js

const Parking = require("../models/Parking");

// ➤ Add parking setup (Admin)
exports.addParking = async (req, res) => {
  try {
    const parking = await Parking.create(req.body);
    res.json(parking);
  } catch (err) {
    res.status(500).json(err);
  }
};

// ➤ Get parking by theatre
exports.getParkingByTheatre = async (req, res) => {

  try {

    const theatre = req.params.theatre.trim();

    const parking = await Parking.findOne({
      theatre: { $regex: `^${theatre}$`, $options: "i" }
    });

    res.json(parking);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }

};



// exports.getAllParking = async(req,res)=>{
//   try{
//     const parking = await Parking.find();
//     res.json(parking);
//   }catch(err){
//     res.status(500).json(err);
//   }
// };

// exports.updateParking = async(req,res)=>{
//   try{
//     const parking = await Parking.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       {new:true}
//     );
//     res.json(parking);
//   }catch(err){
//     res.status(500).json(err);
//   }
// };

// exports.deleteParking = async(req,res)=>{
//   try{
//     await Parking.findByIdAndDelete(req.params.id);
//     res.json({message:"Deleted"});
//   }catch(err){
//     res.status(500).json(err);
//   }
// };


// exports.getAllParking = async(req,res)=>{
//   const data = await Parking.find();
//   res.json(data);
// };

exports.getAllParking = async(req,res)=>{
  try{
    const data = await Parking.find();
    res.json(data);
  }catch(err){
    res.status(500).json(err);
  }
};


exports.updateParking = async(req,res)=>{
  const data = await Parking.findByIdAndUpdate(
    req.params.id,
    req.body,
    {new:true}
  );
  res.json(data);
};

exports.deleteParking = async(req,res)=>{
  await Parking.findByIdAndDelete(req.params.id);
  res.json({message:"Deleted"});
};

