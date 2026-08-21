// snackController.js

const Snack = require("../models/Snack");

// ➤ Add snack (Admin)
exports.addSnack = async (req, res) => {

  try {

    const snack = await Snack.create({
      ...req.body,
      name: req.body.name.trim(),
      theatre: req.body.theatre.trim()
    });

    res.json(snack);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }

};


// ➤ Get snacks by theatre
exports.getSnacksByTheatre = async (req, res) => {

  try {

    const theatre = req.params.theatre.trim();

    const snacks = await Snack.find({
      theatre: { $regex: `^${theatre}$`, $options: "i" }
    });

    res.json(snacks);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }

};



// Get ALL snacks (Admin)
exports.getAllSnacks = async (req,res)=>{
  try{
    const snacks = await Snack.find();
    res.json(snacks);
  }catch(err){
    res.status(500).json(err);
  }
};

exports.getAllSnacks = async(req,res)=>{
  try{
    const snacks = await Snack.find();
    res.json(snacks);
  }catch(err){
    res.status(500).json(err);
  }
};



// Update snack
exports.updateSnack = async (req,res)=>{
  try{
    const snack = await Snack.findByIdAndUpdate(
      req.params.id,
      req.body,
      {new:true}
    );
    res.json(snack);
  }catch(err){
    res.status(500).json(err);
  }
};

// Delete snack
exports.deleteSnack = async (req,res)=>{
  try{
    await Snack.findByIdAndDelete(req.params.id);
    res.json({message:"Snack deleted"});
  }catch(err){
    res.status(500).json(err);
  }
};
