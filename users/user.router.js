const { createUser,
    getUserByUserId,
    getUsers,
    updateUsers,
    login,
    deleteUser, 
    sendinfo,
    appointmentpay,
    getDirections,
    getAutocomplete} = require("./user.controller");
const router = require("express").Router();
const {checkToken} =require("../auth/token_verification");


router.get("/",checkToken, getUsers);
router.post("/create", createUser);
router.post("/login", login);
router.post("/sendinfo", sendinfo);
router.post("/createOrder", appointmentpay);
router.get("/:id",checkToken, getUserByUserId);
// router.post("/login", login);
router.patch("/",checkToken, updateUsers);
router.delete("/",checkToken, deleteUser);
router.get("/autocomplete",checkToken, getAutocomplete);
router.get("/directions",checkToken, getDirections);

module.exports = router;